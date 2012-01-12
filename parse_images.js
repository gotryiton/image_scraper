var jsdom = require("jsdom");
var im = require('imagemagick');

var link = "http://www.shopbop.com/rouched-pencil-skirt-james-perse/vp/v=1/845524441916289.htm?folderID=2534374302023782&extid=affprg-4022050-JPERS4008112588&colorId=12588";
// var link = "http://www.google.com/";

jsdom.env(link, [
  'http://code.jquery.com/jquery-1.7.min.js'
],
function(errors, window) {
  if (errors) throw errors;
  // console.log("The page has", window.$("img").length, "images");
  window.$("img").each(function() {
    var img_url = window.$(this).attr("src");
    if(img_url == '' || img_url == '/') return true;
    if(img_url.split('/')[0] != 'http') img_url = link.split('/')[0] + '//' + link.split('/')[2] + img_url;
    console.log(img_url);
    im.identify(img_url, function(err, features){
      if (err) return; // throw err;
      console.log("Area is", features['height'] * features['width']);
      console.log("");
    });
  });
});