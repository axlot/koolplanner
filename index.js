var Botkit = require('./node_modules/botkit/lib/Botkit.js');
var os = require('os');
var cron = require('node-cron');

firebaseStorage = require('./brain/memory.js')({firebase_uri: 'https://thekoolplanner.firebaseio.com/'});

var controller = Botkit.slackbot({
    debug: true,
    storage: firebaseStorage
});

var beepboop = require('beepboop-botkit').start(controller);

beepboop.on('add_resource', function (message) {
  Object.keys(beepboop.workers).forEach(function (id) {
    // this is an instance of a botkit worker
      var bot = beepboop.workers[id].worker;
  })
});

beepboop.on('botkit.rtm.started', function (bot, resource, meta) {
    var slackUserId = resource.SlackUserID;
    if (meta.isNew && slackUserId) {
        //Save The Channel Where The Bot Was Added
        controller.storage.teams.get(resource.team_id, function(err, team_data){
            console.dir(team_data);
            team_data.channel = resource.SlackIncomingWebhookChannel;
            controller.storage.teams.save(team_data, function(err) {});
        });
        //Broadcast Message
        bot.api.chat.postMessage({
            "text": "Hey there!:wave: I’m your KoolPlanner, your event planning assistant. I’m here to help you plan events without hassle. :spiral_calendar_pad:",
            "attachments": [
                {
                    "fallback": "Hey there! I'm KoolPlanner.",
                    "color": "#36a64f",
                    "text": "To create an event, type `new event` in ​*Direct Message* with me​ (click on Direct Message on the Slack sidebar then find me ​*@KoolPlanner* and hit ​*Go*​!).",
                    "mrkdwn_in": ["text", "pretext"]
                },
                {
                    "fallback": "Required plain-text summary of the attachment.",
                    "color": "#e8a723",
                    "pretext": "*Tip*: Use the :date: _*emoji*_  to view all upcoming events from your team.",
                    "text": ":warning: To read more about KoolPlanner, type `@KoolPlanner details` below, or `details` in a *Direct Message*.",
                    "mrkdwn_in": ["text", "pretext"]
                },
                {
                    "fallback": "Required plain-text summary of the attachment.",
                    "color": "#e8a723",
                    "pretext": ":tada::spiral_calendar_pad::calendar:Start planning awesome events!:calendar::spiral_calendar_pad::tada:",
                    "text": "",
                    "mrkdwn_in": ["text", "pretext"]
                }
            ],
            "channel": resource.SlackIncomingWebhookChannel
        });
    }
});

//Cron Task
cron.schedule('0 0 * * * *', function(){
    console.log('===========================CRON EXECUTED=========================');
    Object.keys(beepboop.workers).forEach(function (id) {
        // this is an instance of a botkit worker
        var bot = beepboop.workers[id].worker;
        var teamID = bot.config.SlackTeamID;
        events.notify(controller, bot, teamID);
    })
});


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

