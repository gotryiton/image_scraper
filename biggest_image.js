var jsdom = require("jsdom");
var im = require('imagemagick');
var fs = require('fs');
var jqueryString = fs.readFileSync("./jquery-1.7.1.min.js").toString();
var restify = require('restify');
var request = require('request');
var libxmljs = require("libxmljs");

var server = restify.createServer();
var count = 0;

server.post('/biggest-image', function(req, res) {
  var url = req.params.url;
  var biggestArea = -1;
  var biggestImage = 'http://stage.assets.gotryiton.s3.amazonaws.com/outfits/de69108096c07298adb6c6ac261cf40a_137_182.jpg';
  
  request({url:url}, function (error, response, body) {
    if (error || response.statusCode != 200) {
      console.log('Could not fetch the URL', error);
      res.send(200, {
        image: biggestImage
      });
      return true;
    }
    
    var dom = libxmljs.parseHtmlString(body);
    
    // pick FB Open Graph Protocol image if available
    var ogImageElement = dom.get('//meta[@property="og:image"]');
    
    if(ogImageElement != undefined) {
      var ogImage = ogImageElement.attr('content').value();
      res.send(200, {
        image: ogImage
      });
      return true;
    }
    
    // find largest of all images
    var images = dom.find('//img');
    
    // set the count to know when all images processed
    count = images.length;

    // iterate through all images on the page
    for(var i = 0; i < images.length; i++) {
      
      try {
        // some people have an img tag with no src attribute - welcome to the internet
        var imageUrl = images[i].attr('src').value();
      } catch(e) {
        console.log('Skipping element ' + images[i] + ' because there was error', e);
        count--;
        continue;
      }
      
      // don't waste time requesting these, need to count them though
      if(imageUrl == '' || imageUrl.substr(-4) == '.gif') {
        count--;
        continue;
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
          console.log('Imagemagick error for image', imageUrl, err);
          return true;
        }
        if (features['format'] == 'GIF' || features['height'] / features['width'] < 0.76) return true;
        var area = features['height'] * features['width'];

        if(area >= biggestArea) {
          biggestArea = area;
          biggestImage = imageUrl;
        }

        // when all images are done processing, return the biggest
        if(!count) {
          res.send(200, {
            image: biggestImage
          });
        }
      });
    }
  });
});

server.listen(1337);