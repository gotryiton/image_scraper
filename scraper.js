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
  var standard = '<meta property="og:title" content="Something went wrong!" />\
                  <meta property="og:image" content="http://stage.assets.gotryiton.s3.amazonaws.com/outfits/de69108096c07298adb6c6ac261cf40a_137_182.jpg" />\
                  <meta property="og:description" content="That doesn\'t look like a working URL." />';
  try {
    request({url:this.url}, function (error, response, body) {
      if (error || response.statusCode != 200) {
      // console.log('Could not fetch the URL', error);
        callback(standard);
      } else {
        callback(body);
      }
    });
  } catch(e) {
    // console.log('There was an error for', this.url, e);
    callback(standard);
  }
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
  return encodeURI(imageUrl);
};

Scraper.prototype.getImage = function(dom, callback) {
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
  var images = this.getImageUrls(dom);
  count = images.length;
  
  // no images? :(
  if(!count) {
    // console.log('No images found for', this.url);
    callback(biggestImage);
    return;
  }
  
  var scraperObj = this;
  
  images.forEach(function(image) {
    scraperObj.getImageArea(image, function(url, area) {
      count--;
      if(area > biggestArea) {
        biggestArea = area;
        biggestImage = url;
      }
      if(!count) callback(biggestImage);
    });
  });
};

Scraper.prototype.getImageUrls = function(dom) {
  var imageUrls = [];
  var imageElements = dom.find('//img');
  var count = imageElements.length;
  for(var i = 0; i < count; i++) {
    try {
      // some people have an img tag with no src attribute - welcome to the internet
      var imageUrl = imageElements[i].attr('src').value();
    } catch(e) {
      // console.log('Skipping element ' + imageElements[i] + ' because there was error', e);
      continue;
    }
    
    // ignoring GIFs, they sometimes are big and they almost never are product images
    if(imageUrl == '' || imageUrl.substr(-4) == '.gif') {
      continue;
    }
    
    imageUrls.push(encodeURI(this.getAbsUrl(imageUrl)));
  }
  return imageUrls;
};

Scraper.prototype.getImageArea = function(imageUrl, callback) {
  im.identify(imageUrl, function(err, features) {
    
    if(err) {
      // console.log('There was an Image Magick error getting', imageUrl, err);
      callback(imageUrl, -1);
      return;
    }

    var skip = features['format'] == 'GIF' || features['height'] / features['width'] < 0.76;
    if(skip) {
      callback(imageUrl, -1);
      return;
    }
    
    var area = features['height'] * features['width'];
    callback(imageUrl, area);
  });
};

Scraper.prototype.getData = function(callback) {
  var scraperObj = this;
  this.getDom(function(dom) {
    var title = scraperObj.getTitle(dom);
    var description = scraperObj.getDescription(dom);
    scraperObj.getImage(dom, function(image) {
      callback({'title': title, 'description': description, 'image': image});
    });
  });
};