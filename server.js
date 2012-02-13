var sc = require('./scraper'),
    restify = require('restify');

var server = restify.createServer();

server.post('/scraper', function(req, res) {
  var url = req.params.url;
  var scInstance = new sc.scraper(url);
  scInstance.getData(function(data) {
    res.send(200, data);
  });
});

module.exports = server;