require('./scraper.js');
var restify = require('restify');

var server = restify.createServer();

server.post('/biggest-image', function(req, res) {
  var url = req.params.url;
  var sc = new Scraper(url);
  sc.getData(function(data) {
    res.send(200, data);
  });
});

server.listen(1337);