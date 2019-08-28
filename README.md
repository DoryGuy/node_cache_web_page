# node_cache_web_page
Simple web page cache. Uses Node.js and Redis  does not handle "amazon.com" well at all!!
I have a 60 second ttl for the cache for testing, makes it easier if things just go away faster.

    // uses these packages.
    npm install request
    npm install redis

    // run redis-server.
    sudo redis-server /opt/local/etc/redis.conf  

    // run node.
    node main.js

    // to run in your browser.
    http://localhost:8080/webpath

 
