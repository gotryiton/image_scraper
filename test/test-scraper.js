require('../scraper.js');

exports['title'] = function(test) {
  var sc = new Scraper('http://www.google.com/');
  sc.getDom(function(dom) {
    test.equal(sc.getTitle(dom), 'Google');
    test.done();
  });
};

exports['description'] = function(test) {
  var sc = new Scraper('http://www.google.com/');
  sc.getDom(function(dom) {
    test.equal(sc.getDescription(dom), "Search the world's information, including webpages, images, videos and more. Google has many special features to help you find exactly what you're looking for.");
    test.done();
  });
};

exports['image'] = function(test) {
  var sc = new Scraper('http://www.shopbop.com/neck-dress-zipper-detail-herve/vp/v=1/845524441928890.htm');
  sc.getDom(function(dom) {
    sc.getImage(dom, function(image){
      test.equal(image, 'http://g-ecx.images-amazon.com/images/G/01/Shopbop/p/pcs/products/herve/herve4008613499/herve4008613499_p1_1-0_254x500.jpg');
      test.done();
    });
  });
};