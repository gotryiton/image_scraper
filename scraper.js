var request = require('request'),
    libxmljs = require("libxmljs"),
    u = require("url");

var Scraper = function(url) {
  this.url = decodeURI(url);
  this.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 5_0 like Mac OS X) AppleWebKit/534.46 (KHTML, like Gecko) Version/5.1 Mobile/9A334 Safari/7534.48.3';
  this.headers = {'User-Agent': this.userAgent};
  this.rules = {
    'images.urbanoutfitters.com': this.urbanTransformers
  };
  this.minImageSize = 10240;
};
  
Scraper.prototype.getBody = function(callback) {
  try {
    request.get({url: this.url, headers: this.headers}, function (error, response, body) {
      if (error || response.statusCode != 200) {
      console.log('Could not fetch the URL', url, error);
        callback(false);
      } else {
        callback(body);
      }
    });
  } catch(e) {
    console.log('Request exception', this.url, e);
    callback(false);
  }
};

Scraper.prototype.getDom = function(string) {
  return libxmljs.parseHtmlString(string);
};

Scraper.prototype.getTitle = function(dom) {
  var title = null;
  var ogTitleElement = dom.get('//meta[@property="og:title"]');
  if (ogTitleElement != undefined) {
    title = ogTitleElement.attr('content').value();
  } else {
    // get meta data title or page title
    try {
      title = dom.get('//meta[@name="title"]').attr('content').value();
    } catch (e) {
      titleElement = dom.get('//title');
      if (titleElement != undefined) {
        title = titleElement.text();
      }
    }
  }
  // trim?
  return title;
};

Scraper.prototype.getDescription = function(dom) {
  var description = null;
  var ogDescriptionElement = dom.get('//meta[@property="og:description"]');
  if (ogDescriptionElement != undefined) {
    description = ogDescriptionElement.attr('content').value();
  } else {
    var descriptionElement = dom.get('//meta[@name="description"]');
    if (descriptionElement != undefined) {
      description = descriptionElement.attr('content').value();
    }
  }
  return description;
};

Scraper.prototype.getImage = function(dom, callback) {
  var biggestSize = this.minImageSize;
  var biggestImage = null;
  var potentialImages = [];
  
  // get open-graph image and return if you get it
  var ogImageElement = dom.get('//meta[@property="og:image"]');
  
  if (ogImageElement != undefined) {
    var ogImage = ogImageElement.attr('content').value();
    callback(ogImage);
    return;
  }
  
  // if no open-graph image pick the biggest image
  var images = this.getImageUrls(dom);
  var count = images.length;
  
  // no images? :(
  if (!count) {
    // console.log('No images found for', this.url);
    callback(biggestImage);
    return;
  }
  
  var scraperObj = this;
  
  images.forEach(function(image) {
    scraperObj.getImageSize(image, function(url, size) {
      count--;
      if (size > biggestSize) {
        biggestSize = size;
        biggestImage = url;
      }
      if (size > scraperObj.minImageSize) {
        potentialImages.push(url);
      }
      if (!count) callback(biggestImage, potentialImages);
    });
  });
};

Scraper.prototype.getImageUrls = function(dom) {
  var imageUrls = [];
  var imageElements = dom.find('//img');
  var count = imageElements.length;
  for (var i = 0; i < count; i++) {
    try {
      // some people have an img tag with no src attribute - welcome to the internet
      var imageUrl = imageElements[i].attr('src').value();
    } catch(e) {
      // console.log('Skipping element ' + imageElements[i] + ' because there was error'); //, e);
      continue;
    }
    
    // ignoring GIFs, they sometimes are big and they almost never are product images
    if (imageUrl == '' || imageUrl.substr(-4) == '.gif') {
      continue;
    }
    
    imageUrls.push(u.resolve(this.url, imageUrl));
  }
  return imageUrls;
};

Scraper.prototype.getImageSize = function(imageUrl, callback) {
  var imageUrl = this.hackUrl(imageUrl);
  console.log('Attempting to fetch Content-Lenght for', imageUrl);
  try {
    request.head({url: imageUrl, headers: this.headers}, function (error, response, body) {
      if (error || response.statusCode != 200) {
        callback(imageUrl, -1);
        console.log('Error requesting', imageUrl);
        return;
      }
      var range = response.headers['content-length'];
      var size = parseInt(range, 10);
      callback(imageUrl, size);
    });
  } catch(e) {
    callback(imageUrl, -1);
    console.log('Expection', e, 'for', imageUrl);
  }
};

Scraper.prototype.hackUrl = function(url) {
  var parsedUrl = u.parse(url);
  var host = parsedUrl.hostname;
  if (this.rules[host] == undefined) {
    return url;
  }
  return this.rules[host](url);
};

Scraper.prototype.urbanTransformers = function(url) {
  return url.replace('$cat$', '$zoom$');
};

Scraper.prototype.getData = function(callback) {
  var scraperObj = this;
  this.getBody(function(body) {
    if (!body) {
      callback({'status': 'error'});
      return;
    }
    var dom = scraperObj.getDom(body);
    var title = scraperObj.getTitle(dom);
    var description = scraperObj.getDescription(dom);
    scraperObj.getImage(dom, function(image, potentialImages) {
      callback({'status': 'ok', 'title': title, 'description': description, 'image': image, 'potentialImages': potentialImages});
    });
  });
};

exports.scraper = Scraper;