// npm install jerk twss
// node server.js
var jerk = require("jerk")
  , twss = require("twss");

var options = {
  server: 'irc.freenode.net'
  , nick: 'jerkbot2012'
  , channels: ['#rwd']
}

twss.threshold = 0.5;

jerk(function(j) {
  j.watch_for(' ', function(message) {
    console.log(message.text[0]);
    var text = message.text[0];
    if (twss.is(text)) {
      message.say(text + "... That's what she said!");
    }
  });

}).connect( options );
