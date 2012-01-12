var jsdom = require("jsdom");
var im = require('imagemagick');

var link = "http://www.shopbop.com/rouched-pencil-skirt-james-perse/vp/v=1/845524441916289.htm?folderID=2534374302023782&extid=affprg-4022050-JPERS4008112588&colorId=12588";
// var link = "http://www.google.com/";
var biggestArea = -1;
var biggestImage = 'http://stage.assets.gotryiton.s3.amazonaws.com/outfits/de69108096c07298adb6c6ac261cf40a_137_182.jpg';

jsdom.env(link, [
  'http://code.jquery.com/jquery-1.7.min.js'
],
function(errors, window) {
  if (errors) throw errors;
  window.$("img").each(function() {
    var imageUrl = window.$(this).attr("src");
    if(imageUrl == '') return true;
    if(imageUrl.slice(0, 4) != 'http') imageUrl = link.split('/')[0] + '//' + link.split('/')[2] + imageUrl;
    im.identify(imageUrl, function(err, features){
      if (err) return; // throw err;
      var area = features['height'] * features['width'];
      if (area > biggestArea) {
        biggestArea = area;
        biggestImage = imageUrl;
      }
      console.log("Biggest image is", biggestImage, "of area", biggestArea);
    });
  });
});