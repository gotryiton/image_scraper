var im = require('imagemagick');
var restify = require('restify');
var request = require('request');
var libxmljs = require("libxmljs");

var server = restify.createServer();
var count = 0;

server.post('/biggest-image', function(req, res) {
  var url = req.params.url;
  var biggestArea = -1;
  var biggestImage = 'http://stage.assets.gotryiton.s3.amazonaws.com/outfits/de69108096c07298adb6c6ac261cf40a_137_182.jpg';
  var title = "What's in a title...";
  var description = 'No words can describe this!';
  
  request({url:url}, function (error, response, body) {
    if (error || response.statusCode != 200) {
      console.log('Could not fetch the URL', error);
      res.send(200, {
        title: title,
        description: description,
        image: biggestImage
      });
      return true;
    }
    
    var dom = libxmljs.parseHtmlString(body);
    
    // deal with title
    var ogTitleElement = dom.get('//meta[@property="og:title"]');
    if(ogTitleElement != undefined) {
      title = ogTitleElement.attr('content').value();
    } else {
      // get meta data title or page title
      try {
        title = dom.get('//meta[@name="title"]').attr('content').value();
      } catch (e) {
        titleElement = dom.get('//title');
        if(titleElement != undefined) {
          title = titleElement.text();
        }
      }
    }
    
    // deal with description
    var ogDescriptionElement = dom.get('//meta[@property="og:description"]');
    if(ogDescriptionElement != undefined) {
      description = ogDescriptionElement.attr('content').value();
    } else {
      var descriptionElement = dom.get('//meta[@name="description"]');
      if(descriptionElement != undefined) description = descriptionElement.attr('content').value();
    }
    
    // pick FB Open Graph Protocol image if available
    var ogImageElement = dom.get('//meta[@property="og:image"]');
    
    if(ogImageElement != undefined) {
      var ogImage = ogImageElement.attr('content').value();
      res.send(200, {
        title: title,
        description: description,
        image: ogImage
      });
      return true;
    }
    
    // find largest of all images
    var images = dom.find('//img');
    
    // set the count to know when all images processed
    count = images.length;
    
    if(!count) {
      res.send(200, {
        title: title,
        description: description,
        image: biggestImage
      });
    }

    // iterate through all images on the page
    images.forEach(function(image, index) {
      
      try {
        // some people have an img tag with no src attribute - welcome to the internet
        var imageUrl = image.attr('src').value();
      } catch(e) {
        console.log('Skipping element ' + image + ' because there was error', e);
        count--;
        return;
      }
      
      // don't waste time requesting these, need to count them though
      if(imageUrl == '' || imageUrl.substr(-4) == '.gif') {
        count--;
        return;
      }

      // convert URLs form relative to absolute
      var twoSlice = imageUrl.substr(2);
      if(twoSlice == '//'){
        imageUrl = 'http:' + imageUrl;
      } else if(twoSlice == '..'){
        var split = url.split('/');
        imageUrl = split[0] + '//' + split[2] + imageUrl.substr(2);
      } else if(imageUrl.slice(0, 4).toLowerCase() != 'http'){
        var split = url.split('/');
        imageUrl = split[0] + '//' + split[2] + imageUrl;
      }

      // let imagemagick fetch and analyze the images in async
      im.identify(encodeURI(imageUrl), function(err, features) {
        count--;
        
        if (err) {
          // you want to avoid the tricky situation where you have an error on the last image
          // if you return without sending out the response you will have the client wait for a time out
          // lost 1.8 hours of sleep figuring out what was going wrong because this didn't show up on a faster internet connection
          if(!count) {
            res.send(200, {
              title: title,
              description: description,
              image: biggestImage
            });
          }
          console.log('Imagemagick error for image', imageUrl, err);
          return true;
        }
        
        // if there's an error for the last image
        if (err && !count) {
          console.log('Imagemagick error for image', imageUrl, err);
          res.send(200, {
            title: title,
            description: description,
            image: biggestImage
          });
          return true;
        }
        
        var skip = features['format'] == 'GIF' || features['height'] / features['width'] < 0.76;
        var area = features['height'] * features['width'];

        if(!skip && area >= biggestArea) {
          biggestArea = area;
          biggestImage = imageUrl;
        }

        // when all images are done processing, return the biggest
        if(!count) {
          res.send(200, {
            title: title,
            description: description,
            image: biggestImage
          });
        }
      });
    });
  });
});

server.listen(1337);