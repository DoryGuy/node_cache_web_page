// let try redis for a simple key/value in memory cache.
var redis = require('redis');
var http = require('http');
var request = require('request');

var time_to_live = 60 // seconds

// return "store": 1 if we can store it, zero otherwise.
//        "time_to_live": NNN   or our default if not there.

function is_cacheable(headers) {
    var store = 1; /// default to storing
    var ttl = time_to_live;
    var cache_control = headers['cache-control'];

    if (!cache_control) { return {'store': store, 'time_to_live': ttl}; }
    console.log("MONKEYS" + cache_control);
    var arr_headers = cache_control.split(',');
    var len = arr_headers.length;
    for (var i = 0; i < len; ++i) {
        if ('no-store' == arr_headers[i]) {
            store = 0;
        } else if (arr_headers[i].length > 6 && 'max-age' == arr_headers[i].substr(0,7)) {
            var args = arr_headers[i];
            console.log("ARGS " + args)
            var args_age = args.split('=');
            console.log("MAX AGE ")
            if (args_age.length = 2) {
	      console.log(args_age[1]);
                ttl = args_age[1];
                if (ttl == 0) {
                    store = 0;
                }
            }
        }
    }
    return { 'store': store, 'time_to_live': ttl };
};

var client = redis.createClient();

client.on('connect', function() {
    console.log('Redis client connected');
});

client.on('error', function (err) {
    console.log('Something went wrong ' + err);
});


// I added this for relative paths that I am getting requests for.
// this isn't a good solution as it makes it stateful.
var previous_successful_url = "";
var failure_count = 0;

//create a server object:
http.createServer(function (req, res) {
  // we won't parse the request just yet.
  var url = req.url.substring(1); // trim the leading slash from the url
  console.log(url);

  client.get(url, function(error, result) {
    if (error) {
      console.log(error);
      throw error;
    }

    //console.log('GET result ->' + result);
    if (result) {
	console.log('URL result found in cache');
	//res.writeHead(200, {'Content-Type': 'text/html'});
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
		      res.writeHead(200, {'Content-Type': 'text/html'});
		      res.write(body);
		      client.set(url, body, 'EX', time_to_live);
                    }
		    res.end();
                  }
		});
              }
          }  else {
	    res.writeHead(200, {'Content-Type': 'text/html'});
	    res.write(body); //write a response to the client
	    res.end(); // end the response
   
            console.log(JSON.stringify(result.headers));
            var cache_results = is_cacheable(result.headers);
            console.log(JSON.stringify(cache_results));
            if (cache_results.store) {
	      client.set(url, body, 'EX', cache_results.time_to_live);
	      previous_successful_url = url;
	      failure_count = 0;
            }
          }
	});
       }
    });
}).listen(8080); //the server object listens on port 8080 
