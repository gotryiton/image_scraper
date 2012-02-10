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

server.listen(3000);
console.log("Server listening on port 3000");