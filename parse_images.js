var jsdom = require("jsdom");
var link_ = "http://www.shopbop.com/rouched-pencil-skirt-james-perse/vp/v=1/845524441916289.htm?folderID=2534374302023782&extid=affprg-4022050-JPERS4008112588&colorId=12588";
var link = "http://www.google.com/";

jsdom.env(link, [
  'http://code.jquery.com/jquery-1.5.min.js'
],
function(errors, window) {
  // console.log("The page has", window.$("img").length, "images");
  window.$("img").each(function() {
    var img_url = window.$(this).attr("src");
    if(img_url.split('/')[0] != 'http') img_url = link.split('/')[0] + '//' + link.split('/')[2] + img_url;
    console.log(img_url);
    console.log(window.$(this).height());
  });
});