var sm = require('../scraper'),
    fs = require('fs'),
    phantom = require('phantom'),
    express = require('express');

var metaPage = fs.readFileSync(__dirname + '/test_helpers/biggest-image-meta-tags-page.html').toString();
var ogPage = fs.readFileSync(__dirname + '/test_helpers/open-graph-page.html').toString();
var noPinPage = fs.readFileSync(__dirname + '/test_helpers/no-pin-page.html').toString();

var app = express();
var server;
app.use(express.static(__dirname + '/test_helpers'));

var testPage = function(path, method, callback) {
  phantomInstance = phantom.create('--load-images=no', function(phantomInstance) {
    phantomInstance.createPage(function(page) {
      page.open('http://localhost:9000' + path, function(status) {
        page.evaluate(method, function(response) {
          phantomInstance.exit();
          callback(response);
        });
      });
    });
  });
};

var sc = new sm.scraper('http://localhost:9000/');

module.exports = {
  setUp: function(callback) {
    server = app.listen(9000);

    callback();
  },
  tearDown: function(callback) {
    server.close(callback);
  },
  group1: {
    metadata: function(test) {
      testPage('/biggest-image-meta-tags-page.html', sc.getMetaData, function(metadata) {
        test.equal(metadata.title, 'Herve Leger V Neck Dress');
        test.equal(metadata.description, 'Herve Leger V Neck Dress at SHOPBOP.COM - FASTEST FREE SHIPPING WORLDWIDE. Buy Herve Leger Online');
      });

      testPage('/open-graph-page.html', sc.getMetaData, function(metadata) {
        test.equal(metadata.title, 'adidas CLIMACOOL Ride Shoes');
        test.equal(metadata.description, 'Light, durable and made to keep your feet fresh when you run. These adidas CC Ride running shoes have a lightweight mesh upper, allover CLIMACOOL® ventilation, adiPRENE®+ in the forefoot for more efficient propulsion and adiPRENE® under the heel for cushioning.');
        test.done();
      });
    },
    price: function(test) {
      testPage('/biggest-image-meta-tags-page.html', sc.getPrice, function(price) {
        test.equal(price, '1050.00'); // $1,050.00
      });

      testPage('/open-graph-page.html', sc.getPrice, function(price) {
        test.equal(price, '90.00'); // $1,050.00
        test.done();
      });
    },
    // non_existent_url: function(test) {
    //   var sc = new sm.scraper('http://localhost:9000/non-existent-url');
    //   sc.getData(function(data) {
    //     test.equal(data.status, "error");
    //     test.done();
    //   });
    // },
    // no_pin: function(test) {
    //   testPage('/no-pin-page.html', sc.getMetaData, function(metadata) {
    //     test.equal(metadata.title, 'adidas CLIMACOOL Ride Shoes');
    //     test.equal(metadata.description, 'Light, durable and made to keep your feet fresh when you run. These adidas CC Ride running shoes have a lightweight mesh upper, allover CLIMACOOL® ventilation, adiPRENE®+ in the forefoot for more efficient propulsion and adiPRENE® under the heel for cushioning.');
    //   });

    //   testPage('/no-pin-page.html', sc.getPrice, function(price) {
    //     test.equal(price, null);
    //     test.done();
    //   });
    // },
    mailto: function(test) {
      var sc = new sm.scraper('http://www.gotryiton.com/');
      var mailtoUrl = 'mailto:your%20friends%20email?subject=Cliketis%20wide-leg%20twill%20pants&body=http://www.theoutnet.com/product/171188;jsessionid_am=1B7B6CE549130FFBB90DCE00807268D6.out-am-gs2-13';
      sc.getImageSize(mailtoUrl, function(imageUrl, size) {
        test.equal(size, -2);
        test.done();
      });
    },
    http: function(test) {
      var sc = new sm.scraper('http://www.gotryiton.com/');
      var mailtoUrl = 'http://weradf.com/';
      sc.getImageSize(mailtoUrl, function(imageUrl, size) {
        test.notEqual(size, -2);
        test.done();
      });
    },
    https: function(test) {
      var sc = new sm.scraper('http://www.gotryiton.com/');
      var mailtoUrl = 'http://weradf.com/';
      sc.getImageSize(mailtoUrl, function(imageUrl, size) {
        test.notEqual(size, -2);
        test.done();
      });
    }
  }
}
