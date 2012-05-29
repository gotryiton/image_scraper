var request = require('request'),
    libxmljs = require("libxmljs"),
    u = require("url");

var Scraper = function(url) {
  this.url = unescape(url);
  this.minImageSize = 10240/2;
  this.imageUrlRules = {
    'images.urbanoutfitters.com': this.urbanTransformers
  };
  this.pageUrlRules = {
    'm.asos.com': this.getAsosToUSFromUK
  };
};

Scraper.prototype.getRequestOptions = function(url) {
  var mobileSafari = 'Mozilla/5.0 (iPhone; CPU iPhone OS 5_0 like Mac OS X) AppleWebKit/534.46 (KHTML, like Gecko) Version/5.1 Mobile/9A334 Safari/7534.48.3';
  var safari = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/534.52.7 (KHTML, like Gecko) Version/5.1.2 Safari/534.52.7';
  
  // uses the host of the page URL and not the image URL
  var host = u.parse(this.url).host;
  
  // rules
  var requestAgentRules = {
    'www.topshop.com': safari,
    'www.saksfifthavenue.com': safari,
    'us.asos.com': safari,
    'www.jcrew.com': safari
  };
  var requestHostRules = {
    'm.shopbop.com': 'GET',
    'www.shopbop.com': 'GET'
  };
  
  // applying the rules
  var headers = {
    'User-Agent': requestAgentRules[host] || mobileSafari
  };
  var method = requestHostRules[host] || 'HEAD';
  
  // setting up the options
  var options = {
    url: url,
    headers: headers,
    method: method,
    timeout: 5000,
    returnRedirectUri: true
  };
  
  return options;
};
  
Scraper.prototype.getBody = function(callback) {
  var options = this.getRequestOptions(this.url);
  options.method = 'GET';
  options.url = this.hackUrl(this.url, 'page');
  var scraperObj = this;
  try {
    var r = request(options, function (error, response, body) {
      if (error || response.statusCode != 200) {
        if (typeof response == "undefined") {
          console.log('Error', error, 'fetching the URL', options.url);
        } else {
          console.log('Status code returned', response.statusCode, 'for URL', options.url);
        }
        callback(false);
      } else {
        scraperObj.url = u.format(r.uri);
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
  if (typeof ogTitleElement !== "undefined") {
    title = ogTitleElement.attr('content').value();
  } else {
    // get meta data title or page title
    try {
      title = dom.get('//meta[@name="title"]').attr('content').value();
    } catch (e) {
      titleElement = dom.get('//title');
      if (typeof titleElement !== "undefined") {
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
  if (typeof ogDescriptionElement !== "undefined") {
    description = ogDescriptionElement.attr('content').value();
  } else {
    var descriptionElement = dom.get('//meta[@name="description"]');
    if (typeof descriptionElement !== "undefined") {
      description = descriptionElement.attr('content').value();
    }
  }
  return description;
};

Scraper.prototype.getImage = function(dom, callback) {
  var biggestSize = this.minImageSize;
  var biggestImage = null;
  var alternateImages = [];
  
  // get open-graph image and return if you get it
  var ogImageElement = dom.get('//meta[@property="og:image"]');
  
  if (typeof ogImageElement !== "undefined") {
    var ogImage = ogImageElement.attr('content').value();
    biggestSize = Number.MAX_VALUE;
    biggestImage = ogImage;
  }
  
  // if no open-graph image pick the biggest image
  var images = this.getImageUrls(dom);
  var count = images.length;
  
  // no images? :(
  if (!count) {
    console.log('No images found for', this.url);
    callback(biggestImage, alternateImages);
    return;
  }
  
  var scraperObj = this;
  
  images.forEach(function(image) {
    scraperObj.getImageSize(image, function(url, size) {
      count--;
      if (size > scraperObj.minImageSize) {
        if (size > biggestSize) {
          if (biggestImage !== null) {
            alternateImages.push(biggestImage);
          }
          biggestSize = size;
          biggestImage = url;
        } else {
          alternateImages.push(url);
        }
      }
      if (!count) callback(biggestImage, alternateImages);
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
  var options = this.getRequestOptions(imageUrl);
  options.url = this.hackUrl(imageUrl, 'image');
  console.log('Attempting to fetch Content-Length for', imageUrl);
  try {
    request(options, function (error, response, body) {
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

Scraper.prototype.hackUrl = function(url, type) {
  var rules;
  if (type = 'page') {
    rules = this.pageUrlRules;
  } else if (tyhpe = 'image') {
    rules = this.imageUrlRules;
  }
  var host = u.parse(this.url).host;
  rule = rules[host];
  return rule ? rule(url) : url;
};

Scraper.prototype.urbanTransformers = function(url) {
  var hackedUrl = url.replace('$cat$', '$zoom$');
  hackedUrl = hackedUrl.replace('$detailthumb$', '$zoom$');
  return hackedUrl;
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
    var price = scraperObj.getPrice(body);
    scraperObj.getImage(dom, function(image, alternateImages) {
      if (title === null && image === null) {
        callback({'status': 'error'});
        return;
      }
      callback({'status': 'ok', 'title': title, 'description': description, 'image': image, 'alternateImages': alternateImages, 'price': price, 'url': scraperObj.url});
    });
  });
};

Scraper.prototype.getPrice = function(string) {
  var trailingAngleBracketRegExp = new RegExp(/\$\s*[\d,]+\.\d+\</g); // looks for a ending '<'
  var sephoraRegExp = new RegExp(/\>\s*\$\s*[\d,]+[\.\d]*/g); // doesn't look for decimal point and looks for a leading '>'

  var specialRegexList = {
    'www.zara.com': new RegExp(/[\d,]+\.\d+\s*USD/g), // looks for 1.2 USD
    'www.jcrew.com': trailingAngleBracketRegExp,
    'www.singer22.com': trailingAngleBracketRegExp,
    'store.americanapparel.net': trailingAngleBracketRegExp,
    'm.sephora.com': sephoraRegExp,
    'www.sephora.com': sephoraRegExp,
    'sephora.com': sephoraRegExp
  };

  var host = u.parse(this.url).host;
  var regex = specialRegexList[host] || new RegExp(/\$\s*[\d,]+\.\d+/g); // looks for $( )1.2
  var matches = string.match(regex);
  console.log(matches);
  if (matches === null) {
    return null;
  }
  // return first non-zero price
  for (var i = 0; i < matches.length; i++) {
    var price = matches[i];
    var cleanPrice = this.intPrice(price);
    // if (pricesBlacklist.indexOf(cleanPrice) == -1) {
    if (cleanPrice > 0) {
      return cleanPrice;
    }
  }
  return null;
};

Scraper.prototype.intPrice = function(price) {
  var removeTheseChars = [' ', ',', '$', 'USD', '>', '<'];
  for (index in removeTheseChars) {
    price = price.replace(removeTheseChars[index], '');
  }
  return price;
};

Scraper.prototype.getAsosToUSFromUK = function(url) {
  url = url.replace('http://m.asos.com/mt/www.asos.com/countryid/2/', 'http://m.asos.com/mt/www.asos.com/');
  url = url.replace('http://m.asos.com/mt/www.asos.com/', 'http://m.asos.com/mt/www.asos.com/countryid/2/');
  return url;
};

exports.scraper = Scraper;