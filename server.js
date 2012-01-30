// npm install jerk twss
// node server.js
var jerk = require("jerk")
  , twss = require("twss")
  , count = 0;

var options = {
  server: 'irc.freenode.net'
  , nick: 'jerkbot2012'
  , channels: ['#rwd']
}

twss.threshold = 0.5;

jerk(function(j) {
  j.watch_for(' ', function(message) {
    // console.log(message.text[0]);
    var text = message.text[0];
    if (twss.is(text)) {
      // In order to keep the threshold low enough to be funny, and yet not be
      // completly annoying, we only report every 20 times a message qualifies.
      if (count == 20) {
        message.say(text + "... That's what she said!");
        count = 1;
      }
      count++;
    }
  });

}).connect( options );
