var jsdom = require("jsdom");
var im = require('imagemagick');
var fs = require('fs');
var jqueryString = fs.readFileSync("./jquery-1.7.1.min.js").toString();
var restify = require('restify');

var server = restify.createServer();

server.post('/biggest-image', function(req, res) {
  var url = req.params.url;
  var biggestArea = -1;
  var biggestImage = 'http://stage.assets.gotryiton.s3.amazonaws.com/outfits/de69108096c07298adb6c6ac261cf40a_137_182.jpg';
  var count = 0;
  
  jsdom.env({
    html: encodeURI(url),
    src: [
      jqueryString
    ],
    done: function(errors, window) {
      // on error send back the default image
      if (errors) {
        res.send(200, {
          image: biggestImage
        });
        console.log('Errors parsing', url, 'Errors:', errors);
        return true; //throw errors;
      }
      
      // set the count to know when all images processed
      count = window.$("img").length;
      
      // iterate through all images on the page
      window.$("img").each(function() {
        var imageUrl = window.$(this).attr("src");
        
        // don't waste time requesting these, need to count them though
        if(imageUrl == '') {
          count--;
          return true;
        }
        
        // convert URLs form relative to absolute
        if(imageUrl.slice(0, 2) == '//'){
          imageUrl = 'http:' + imageUrl;
        } else if(imageUrl.slice(0, 4) != 'http'){
          var split = url.split('/');
          imageUrl = split[0] + '//' + split[2] + imageUrl;
        }
        
        // let imagemagick fetch and analyze the images in async
        im.identify(encodeURI(imageUrl), function(err, features){
          count--;
          if (err) {
            console.log('Imagemagick error for image', imageUrl);
            return true;
          }
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
      });
    }
  });
});

server.listen(1337);