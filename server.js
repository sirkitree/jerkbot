var jerk = require("jerk"),
    http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
    events = require("events"),
    sys = require("sys");

var options = {
  server: 'irc.freenode.net',
  nick: 'jerkbot2011',
  channels: [
    '#rwd'
  ]
}

jerk( function( j ) {

  j.watch_for( 'soup', function( message ) {
    message.say( message.user + ': soup is good food!' );
  });

  j.watch_for( /^(.+) are silly$/, function( message ) {
    message.say( message.user + ': ' + message.match_data[1] + ' are NOT SILLY. Don\'t joke!' );
  });

  // If the user is requesting the Twitter search feature
  j.watch_for( /^(.+) :twitter$/, function( message ) {

    /*
     * On each request, if it takes longer than 20 seconds, end the response
     * and send back an empty structure.
     */
    var timeout = setTimeout(function() {
      message.say(JSON.stringify([]));
    }, 20000);

    /*
     * Register a listener for the 'tweets' event on the Twitter.EventEmitter.
     * This event is fired when new tweets are found and parsed.
     * @see get_tweets()
     */
    Twitter.EventEmitter.once("tweets", function(tweets){
     // Send the tweets structure back to the client
     message.say(JSON.stringify(tweets));

     // Stop the timeout function from completing (see below)
     clearTimeout(timeout);
    });

    // Parse out the search term
    query = message.match_data[1];

    // Search for tweets with the search term
    get_tweets(query);
  });

}).connect( options );


/**
 * Twitter stuff.
 *
 * @todo: move to it's own file.
 */
var Twitter = (function(){
   var eventEmitter = new events.EventEmitter();

   return {
      EventEmitter : eventEmitter,  // The event broadcaster
      latestTweet : 0               // The ID of the latest searched tweet
   };
})();

/**
 * Pings the Twitter Search API with the specified query term
 *
 * @param {Object} query
 */
function get_tweets(query) {

  // Send a search request to Twitter
  var request = http.request({
    host: "search.twitter.com",
    port: 80,
    method: "GET",
    path: "/search.json?since_id=" + Twitter.latestTweet + "result_type=recent&rpp=5&q=" + query
  })

  /*
   * When an http request responds, it broadcasts the response() event,
   * so let's listen to it here. Now, this is just a simple 'Hey, I got
   * a response' event, it doesn't contain the data of the response.
   */
  .on("response", function(response){
    var body = "";

    /*
     * Now as the the response starts to get chunks of data streaming in
     * it will broadcast the data() event, which we will listen to. When
     * we receive data, append it to a body variable.
     */
    response.on("data", function(data){
      body += data;

      try {
        /*
         * Since the Twitter Search API is streaming, we can't listen to
         * the end() method, so I've got some logic where we try to parse
         * the data we have so far. If it can't be parsed, then the
         * response isn't complete yet.
         */
        var tweets = JSON.parse(body);

        /*
         * The data was successfully parsed, so we can safely assume we
         * have a valid structure.
         */
        if (tweets.results.length > 0) {
          /*
           * We actually got some tweets, so set the Twitter.latestTweet
           * value to the ID of the latest one in the collection.
           */
          Twitter.latestTweet = tweets.max_id_str;

          /*
           * Remember, node.js is an event based framework, so in order
           * to get the tweets back to the client, we need to broadcast
           * a custom event named 'tweets'. There's a function listening
           * for this event in the createServer() function (see below).
           */
          Twitter.EventEmitter.emit("tweets", tweets);
        }
        /*
         * I'm clearing all objects listening for the 'tweets' event here to
         * clean up any listeners created on previous requests that did not
         * find any tweets.
         */
        Twitter.EventEmitter.removeAllListeners("tweets");
      }
      catch (ex) {
        /*
         * If we get here, it's because we received data from the request,
         * but it's not a valid JSON struct yet that can be parsed into an
         * Object.
         */
        console.log("waiting for more data chunks...");
      }
    });
  });

  // End the request
  request.end();
}