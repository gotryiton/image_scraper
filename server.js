var sc = require('./scrapher'),
    restify = require('restify');

var server = restify.createServer();

server.post('/scraper', function(req, res) {
  process.on('uncaughtException', function (err) {
    console.log('Caught uncaught exception: ' + err);
    res.send(415, {'status': 'error'});
  });

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