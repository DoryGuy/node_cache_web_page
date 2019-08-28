// let try redis for a simple key/value in memory cache.
var redis = require('redis');
var http = require('http');
var request = require('request');


var client = redis.createClient();

client.on('connect', function() {
    console.log('Redis client connected');
});

client.on('error', function (err) {
    console.log('Something went wrong ' + err);
});

var time_to_live = 60 // seconds

// I added this for relative paths that I am getting requests for.
// this isn't a good solution as it makes it stateful.
var previous_successful_url = "";
var failure_count = 0;

//create a server object:
http.createServer(function (req, res) {
  // we won't parse the request just yet.
  var url = req.url.substring(1); // trim the leading slash from the url
  console.log(url);
  res.writeHead(200, {'Content-Type': 'text/html'});

  client.get(url, function(error, result) {
    if (error) {
      console.log(error);
      throw error;
    }

    //console.log('GET result ->' + result);
    if (result) {
	console.log('URL result found in cache');
	res.write(result); //write a response to the client
        res.end(); // end the response
        previous_successful_url = url;
        failure_count = 0;
    } else {
	console.log('URL not found result in redis');
	request(('http://' + url), { json: true }, (err, result, body) => {
	  if (err) { 
              if (failure_count == 0) {
		request(('http://' + previous_successful_url + '/' + url), { json: true }, (err, result, body) => {
                  if (err) { 
                    failure_count += 1; 
                    console.log(err); 
                  } else {
                    console.log('http://' + previous_successful_url + '/' + url);
		    console.log("found sub url");
                    if (!body) {
                        console.log('nothing here');
                    } else {
		      res.write(body);
		      client.set(url, body, 'EX', time_to_live);
                    }
		    res.end();
                  }
		});
              }
          }  else {
	    res.write(body); //write a response to the client
	    res.end(); // end the response
	    client.set(url, body, 'EX', time_to_live);
	    previous_successful_url = url;
	    failure_count = 0;
          }
	});
       }
    });
}).listen(8080); //the server object listens on port 8080 
