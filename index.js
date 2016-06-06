
var Botkit = require('./node_modules/botkit/lib/Botkit.js');
var os = require('os');

firebaseStorage = require('./brain/memory.js')({firebase_uri: 'https://thekoolplanner.firebaseio.com/'});

var controller = Botkit.slackbot({
    debug: true,
    storage: firebaseStorage
});

require('beepboop-botkit').start(controller);

beepboop.on('add_resource', function (message) {
  Object.keys(beepboop.workers).forEach(function (id) {
    // this is an instance of a botkit worker
    var bot = beepboop.workers[id]
  })
})


//var greetingBot = require('./brain/greetings.js');
//greetingBot.init(controller); 

var events = require('./brain/events.js');
events.init(controller);

function formatUptime(uptime) {
    var unit = 'second';
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'minute';
    }
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'hour';
    }
    if (uptime != 1) {
        unit = unit + 's';
    }

    uptime = uptime + ' ' + unit;
    return uptime;
}