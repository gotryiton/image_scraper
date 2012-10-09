var request     = require('request'),
    phantom     = require('phantom'),
    u           = require('url');

var Scraper = function(url) {
  this.url           = unescape(url);
  this.noPin         = false;
  this.minImageSize  = 10240/2;

  this.imageUrlRules = {
    'images.urbanoutfitters.com': this.urbanTransformers
  };
  this.pageUrlRules  = {
    'm.asos.com': this.getAsosToUSFromUK
  };
};

Scraper.prototype.getMetaData = function() {
  var title = null;
  var description = null;
  var ogImage = null;

  var metaElements = document.getElementsByTagName('meta');
  for (var i = 0; i < metaElements.length; i++) {
    // TODO: Break early?
    var element = metaElements[i];

    // Handle OpenGraph elements
    var property = element.getAttribute('property');
    console.log(property);
    if (property !== null) {
      switch(property) {
        case 'og:title':
          title = element.getAttribute('content');
          break;
        case 'og:description':
          description = element.getAttribute('content');
          break;
        case 'og:image':
          ogImage = element.getAttribute('content');
      }
    }

    // Handle general meta information
    var name = element.getAttribute('name');
    if (name !== null) {
      switch(name) {
        case 'title':
          title = title || element.getAttribute('content');
          break;
        case 'description':
          description = description || element.getAttribute('content');
          break;
      }
    }
  }

  if (ogImage !== null) this.ogImage = ogImage;
  title = title || document.title;

  return {
    title: title,
    description: description
  };
};

Scraper.prototype.getPrice = function() {
  var string = document.body.innerHTML;

  // TODO: Make regulax expression faster and possibly more robust
  var regex = new RegExp(/(\$\s*[\d,]+\.\d+)|([\d,]+\.\d+\s*USD)/g);
  var matches = string.match(regex);
  if (matches === null) {
    return null;
  }
  // return first non-zero price
  for(var i = 0; i < matches.length; i++) {
    var price = matches[i];

    // clearn price
    price = price.replace(' ', '');
    price = price.replace(',', '');
    price = price.replace('$', '');
    price = price.replace('USD', '');
    price = price.replace('>', '');

    if (price > 0) {
      return price;
    }
  }
  return null;
};

Scraper.prototype.getData = function(callback) {
  var scraper = this;
  phantom.create(function(ph) {
    ph.createPage(function(page) {
      page.onConsoleMessage = function (msg) {
          console.log(msg);
      };

      page.open(scraper.url, function(status) {
        if (status == 'fail') {
          callback({
            'status': 'error'
          });
          return;
        }

        page.evaluate(scraper.getMetaData, function(metaData) {
          page.evaluate(scraper.getPrice, function(price) {
            callback({
              status: 'ok',
              title: metaData.title,
              description: metaData.description,
              image: '',
              alternateImages: [],
              price: price
            });
            ph.exit();
          });
        });
      });
    });
  });
};

Scraper.prototype.getAsosToUSFromUK = function(url) {
  url = url.replace('http://m.asos.com/mt/www.asos.com/countryid/2/', 'http://m.asos.com/mt/www.asos.com/');
  url = url.replace('http://m.asos.com/mt/www.asos.com/', 'http://m.asos.com/mt/www.asos.com/countryid/2/');
  return url;
};

exports.scraper = Scraper;