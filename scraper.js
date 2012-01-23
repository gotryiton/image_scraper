var request = require('request'),
    libxmljs = require("libxmljs"),
    im = require('imagemagick');

Scraper = function(url) {
  this.url = url;
};

Scraper.prototype.getUrl = function() {
  return this.url;
};
  
Scraper.prototype.getBody = function(callback) {
    request({url:this.url}, function (error, response, body) {
    if (error || response.statusCode != 200) {
      console.log('Could not fetch the URL', error);
      callback(undefined);
    } else {
      callback(body);
    }
  });
};

Scraper.prototype.getDom = function(callback) {
  this.getBody(function(body) {
    var dom = libxmljs.parseHtmlString(body);
    callback(dom);
  });
};

Scraper.prototype.getTitle = function(dom) {
  var title = "What's in a title...";
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
  // trim?
  return title;
};

Scraper.prototype.getDescription = function(dom) {
  var description = 'No words can describe this!';
  var ogDescriptionElement = dom.get('//meta[@property="og:description"]');
  if(ogDescriptionElement != undefined) {
    description = ogDescriptionElement.attr('content').value();
  } else {
    var descriptionElement = dom.get('//meta[@name="description"]');
    if(descriptionElement != undefined) description = descriptionElement.attr('content').value();
  }
  return description;
};

Scraper.prototype.getAbsUrl = function(imageUrl) {
  var url = this.url;
  var twoSlice = imageUrl.substr(2);
  if(twoSlice == '//'){
    imageUrl = 'http:' + imageUrl;
  } else if(twoSlice == '..'){
    var split = url.split('/');
    imageUrl = split[0] + '//' + split[2] + imageUrl.substr(2);
  } else if(imageUrl.slice(0, 4).toLowerCase() != 'http') {
    // handle the case where the URL starts with folder name and not '/'
    if (imageUrl.charAt(0) != '/') imageUrl = '/' + imageUrl;
    var split = url.split('/');
    imageUrl = split[0] + '//' + split[2] + imageUrl;
  }
  return imageUrl;
};

Scraper.prototype.getImage = function(dom, callback) {
  var scraperObj = this;
  var biggestArea = -1;
  var biggestImage = 'http://stage.assets.gotryiton.s3.amazonaws.com/outfits/de69108096c07298adb6c6ac261cf40a_137_182.jpg';
  
  // get open-graph image and return if you get it
  var ogImageElement = dom.get('//meta[@property="og:image"]');
  
  if(ogImageElement != undefined) {
    var ogImage = ogImageElement.attr('content').value();
    callback(ogImage);
    return;
  }
  
  // if no open-graph image pick the biggest image
  var images = dom.find('//img');
  
  count = images.length;
  
  // no images? :(
  if(!count) {
    console.log('No images found for', this.url);
    callback(biggestImage);
    return;
  }

  // iterate through all images on the page
  images.forEach(function(image) {
    
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
    imageUrl = scraperObj.getAbsUrl(imageUrl);

    // let imagemagick fetch and analyze the images in async
    im.identify(encodeURI(imageUrl), function(err, features) {
      
      count--;
      
      if (err) {
        // you want to avoid the tricky situation where you have an error on the last image
        // if you return without sending out the response you will have the client wait for a time out
        // lost 1.8 hours of sleep figuring out what was going wrong because this didn't show up on a faster internet connection
        if(!count) callback(biggestImage);
        console.log('Imagemagick error for image', imageUrl, err);
        return;
      }
      
      var skip = features['format'] == 'GIF' || features['height'] / features['width'] < 0.76;
      var area = features['height'] * features['width'];

      if(!skip && area >= biggestArea) {
        biggestArea = area;
        biggestImage = imageUrl;
      }

      // when all images are done processing, return the biggest
      if(!count) callback(biggestImage);
    });
  });
};

Scraper.prototype.getData = function(callback) {
  var scraperObj = this;
  this.getDom(function(dom) {
    var title = scraperObj.getTitle(dom);
    var description = scraperObj.getDescription(dom);
    scraperObj.getImage(dom, function(image) {
      callback({'title':title, 'description':description, 'image':image});
    });
  });
};

// var sc = new Scraper('http://www.shopbop.com/rouched-pencil-skirt-james-perse/vp/v=1/845524441916289.htm?folderID=2534374302023782&extid=affprg-4022050-JPERS4008112588&colorId=12588');
// 
// sc.getData(function(data) {
//   console.log(data);
// });