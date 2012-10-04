process.on('uncaughtException', function (err) {
  console.log('Caught uncaught exception: ' + err);
});

var sc = require('./scraper'),
    restify = require('restify');

var server = restify.createServer();

server.post('/scraper', function(req, res) {
  var url = req.params.url;
  console.log('Scrape request for', url);
  var scInstance = new sc.scraper(url);
  scInstance.getData(function(data) {
    res.send(200, data);
  });
});

server.get('/status', function(req, res) {
  var response = {'status': 'ok'};
  res.send(200, response);
});

module.exports = server;