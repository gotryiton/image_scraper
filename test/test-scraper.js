require('../scraper.js');
var fs = require('fs');

var metaPage = fs.readFileSync('./test_pages/biggest-image-meta-tags-page.html').toString();
var ogPage = fs.readFileSync('./test_pages/open-graph-page.html').toString();

exports['title'] = function(test) {
  var sc = new Scraper('http://www.gotryiton.com/');
  test.equal(sc.getTitle(sc.getDom(metaPage)), 'Herve Leger V Neck Dress');
  test.equal(sc.getTitle(sc.getDom(ogPage)), 'adidas CLIMACOOL Ride Shoes');
  test.done();
};

exports['description'] = function(test) {
  var sc = new Scraper('http://www.gotryiton.com/');
  test.equal(sc.getDescription(sc.getDom(metaPage)), 'Herve Leger V Neck Dress at SHOPBOP.COM - FASTEST FREE SHIPPING WORLDWIDE. Buy Herve Leger Online');
  test.equal(sc.getDescription(sc.getDom(ogPage)), 'Light, durable and made to keep your feet fresh when you run. These adidas CC Ride running shoes have a lightweight mesh upper, allover CLIMACOOL® ventilation, adiPRENE®+ in the forefoot for more efficient propulsion and adiPRENE® under the heel for cushioning.');
  test.done();
};

exports['og-image'] = function(test) {
  var sc = new Scraper('http://www.gotryiton.com/');
  sc.getImage(sc.getDom(ogPage), function(image){
    test.equal(image, 'http://s7d5.scene7.com/is/image/adidasgroup/G51846_01');
    test.done();
  });
};

exports['image-area'] = function(test) {
  var sc = new Scraper('http://www.gotryiton.com/');
  sc.getImageArea('fire-lizard.jpg', function(image, area){
    test.equal(area, 127200);
    test.done();
  });
};

exports['get-abs-url'] = function(test) {
  var sc = new Scraper('http://www.gotryiton.com/');
  test.equal(sc.getAbsUrl('/foo/bar.baz'), 'http://www.gotryiton.com/foo/bar.baz');
  var sc = new Scraper('http://www.gotryiton.com/GTIO');
  test.equal(sc.getAbsUrl('//www.gotryiton.com/foo/bar.baz'), 'http://www.gotryiton.com/foo/bar.baz');
  test.done();
};

// untested getImageUrls