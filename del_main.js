// let try redis for a simple key/value in memory cache.
var redis = require('redis');
var http = require('http');



var client = redis.createClient();

client.on('connect', function() {
    console.log('Redis client connected');
});

client.on('error', function (err) {
    console.log('Something went wrong ' + err);
});


//create a server object:
http.createServer(function (req, res) {
  // we won't parse the request just yet.
  var url = req.url.substring(1); // trim the leading slash from the url
  console.log(url);

  client.del(url, function(error, result) {
    if (error) {
      console.log(error);
      throw error;
    }
    if (result) {
      console.log("success removed " + url);
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.write("cache cleared!"); //write a response to the client
      res.end(); // end the response
    } else {
      console.log("failure to remove " + url);
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.write("cache probably already empty!"); //write a response to the client
      res.end(); // end the response
    }
  });

}).listen(8081); //the server object listens on port 8081 
