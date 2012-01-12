var jsdom = require("jsdom");
var im = require('imagemagick');
var fs = require('fs');
var jquery = fs.readFileSync("./jquery-1.7.1.min.js").toString();

// var link = 'http://www.pinkmascara.com/anna-kosturova-marilyn-dress-as-seen-on-miranda-kerr-2';
// var link = "http://www.shopbop.com/rouched-pencil-skirt-james-perse/vp/v=1/845524441916289.htm?folderID=2534374302023782&extid=affprg-4022050-JPERS4008112588&colorId=12588";
// var link = "http://shop.nordstrom.com/s/donna-morgan-belted-chiffon-dress/3172484?cm_ite=donna_morgan_belted_chiffon_dress:259207_7&cm_pla=dresses:women:dress&cm_ven=Linkshare&siteid=xC_K04x1nMI-UkWMJmyPLfjRCCVlsUYKFw&url=http://shop.nordstrom.com/S/3172484?cm_cat=datafeed";
// var link = 'http://www.michaelstars.com/p-6463.php?=&utm_source=affiliatetraction&utm_medium=commissionjunction&utm_campaign=http://www.michaelstars.com/p-6463.php';
// var link = 'http://www.80spurple.com/shop/product/136846/5133/purple-label-womens-ashley-button-down-sleeveless-top-emerald';
// var link = 'http://www.google.com/';
// var link = 'http://www.shopbop.com/pencil-skirt-blank-denim/vp/v=1/845524441925870.htm?folderID=2534374302153272&extid=affprg-4022050-BLANK4006113022&colorId=13022';
var url = 'http://www.flickr.com/explore/';

function getLargestImage(link) {
  var biggestArea = -1;
  var biggestImage = 'http://stage.assets.gotryiton.s3.amazonaws.com/outfits/de69108096c07298adb6c6ac261cf40a_137_182.jpg';
  jsdom.env({
    html: link,
    src: [
      jquery
    ],
    done: function(errors, window) {
      if (errors) throw errors;
      // console.log("Number of images on page", window.$("img").length);
      window.$("img").each(function() {
        var imageUrl = window.$(this).attr("src");
        if(imageUrl == '') return true;
        if(imageUrl.slice(0, 4) != 'http') imageUrl = link.split('/')[0] + '//' + link.split('/')[2] + imageUrl;
        im.identify(imageUrl, function(err, features){
          if (err) return true; // throw err;
          var area = features['height'] * features['width'];
          if (area >= biggestArea) {
            biggestArea = area;
            biggestImage = imageUrl;
          }
          // console.log("Biggest image is", biggestImage, "of area", biggestArea);
        });
      });
    }
  });
  return biggestImage;
}
    