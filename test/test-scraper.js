var sm = require('../scraper'),
    fs = require('fs');

var metaPage = fs.readFileSync(__dirname + '/test_helpers/biggest-image-meta-tags-page.html').toString();
var ogPage = fs.readFileSync(__dirname + '/test_helpers/open-graph-page.html').toString();
var noPinPage = fs.readFileSync(__dirname + '/test_helpers/no-pin-page.html').toString();

exports['title'] = function(test) {
  var sc = new sm.scraper('http://www.gotryiton.com/');
  test.equal(sc.getTitle(sc.getDom(metaPage)), 'Herve Leger V Neck Dress');
  test.equal(sc.getTitle(sc.getDom(ogPage)), 'adidas CLIMACOOL Ride Shoes');
  test.done();
};

exports['description'] = function(test) {
  var sc = new sm.scraper('http://www.gotryiton.com/');
  test.equal(sc.getDescription(sc.getDom(metaPage)), 'Herve Leger V Neck Dress at SHOPBOP.COM - FASTEST FREE SHIPPING WORLDWIDE. Buy Herve Leger Online');
  test.equal(sc.getDescription(sc.getDom(ogPage)), 'Light, durable and made to keep your feet fresh when you run. These adidas CC Ride running shoes have a lightweight mesh upper, allover CLIMACOOL® ventilation, adiPRENE®+ in the forefoot for more efficient propulsion and adiPRENE® under the heel for cushioning.');
  test.done();
};

exports['price'] = function(test) {
  var sc = new sm.scraper('http://www.gotryiton.com/');
  test.equal(sc.getPrice(metaPage), '1050.00'); // $1,050.00
  test.equal(sc.getPrice(ogPage), '90.00');
  test.done();
};

exports['non-existant-url'] = function(test) {
  var sc = new sm.scraper('http://www.afasfa6f54g35a4tr65w4t365654645546we54y65dg4hw6e546ds54g6s5wr3e36363#%^@#sfasfasgasf.com/');
  sc.getData(function(data) {
    test.equal(data.status, "error");
    test.done();
  });
};

exports['no-pin'] = function(test) {
  var sc = new sm.scraper('http://www.gotryiton.com/');
  test.equal(sc.getTitle(sc.getDom(noPinPage)), 'adidas CLIMACOOL Ride Shoes');
  test.equal(sc.getDescription(sc.getDom(noPinPage)), 'Light, durable and made to keep your feet fresh when you run. These adidas CC Ride running shoes have a lightweight mesh upper, allover CLIMACOOL® ventilation, adiPRENE®+ in the forefoot for more efficient propulsion and adiPRENE® under the heel for cushioning.');
  test.equal(sc.getPrice(noPinPage), null);
  sc.getImage(sc.getDom(noPinPage), function(image) {
    test.equal(image, null);
    test.done();
  });
};

exports['mailto'] = function(test) {
  var sc = new sm.scraper('http://www.gotryiton.com/');
  var mailtoUrl = 'mailto:your%20friends%20email?subject=Cliketis%20wide-leg%20twill%20pants&body=http://www.theoutnet.com/product/171188;jsessionid_am=1B7B6CE549130FFBB90DCE00807268D6.out-am-gs2-13';
  sc.getImageSize(mailtoUrl, function(imageUrl, size) {
    test.equal(size, -2);
    test.done();
  });
};

exports['http'] = function(test) {
  var sc = new sm.scraper('http://www.gotryiton.com/');
  var mailtoUrl = 'http://weradf.com/';
  sc.getImageSize(mailtoUrl, function(imageUrl, size) {
    test.notEqual(size, -2);
    test.done();
  });
};

exports['https'] = function(test) {
  var sc = new sm.scraper('http://www.gotryiton.com/');
  var mailtoUrl = 'http://weradf.com/';
  sc.getImageSize(mailtoUrl, function(imageUrl, size) {
    test.notEqual(size, -2);
    test.done();
  });
};