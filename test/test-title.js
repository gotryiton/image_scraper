require('../scraper.js');

exports['title'] = function(test) {
  var sc = new Scraper('http://www.google.com/');
  sc.getDom(function(dom) {
    test.equal(sc.getTitle(dom), 'Google');
    test.done();
  });
};