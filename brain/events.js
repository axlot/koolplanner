module.exports.init = function(controller) {
    //Alert Attenddes Users
    function alertAttendees(bot, convo, customMessage, eventId) {
        controller.storage.rsvp.all(function(err, all_attend_data) {
            var length = all_attend_data.length,
                attendees;
            //Iterate Over Event's Attenddes
            for(var i=0; i<length; i++) {
                if(all_attend_data[i].id == eventId) {
                    //Get Event Attenddes
                    attendees = all_attend_data[i].attend;
                    break;
                }
            }
            //Iterate Over Attenddes Obj And Get User's Names
            for(var userID in attendees){
                bot.startPrivateConversation({user: userID}, function(err, convo){
                    bot.api.users.info({user: convo.source_message.user}, function(err, user) {
                        convo.say('Hey ' + user.user.real_name + '!\n' + customMessage);
                    });
                });
            }
        });
        convo.next();
    }
    //Event Constructor
    var Event = function(name, description, date, time, location, mTimeStamp, mChannel, teamId) {
        this.title = name;
        this.description = description;
        this.date = date;
        this.time = time;
        this.location = location;
        this.mTimeStamp = mTimeStamp;
        this.mChannel = mChannel;
        this.team_id = teamId;
    };
    //Creation, Editing and Attend Conversation
    var conversation = function (bot, message, eventId) {
        //Start Conversation
        bot.startConversation(message, function(err, convo) {
            //Get Event Title
            convo.say('Hey! Let\'s plan this event together!');
            convo.ask('First, what is the title of the event?', function(response, convo) {
                convo.next();
            }, {'key': 'title'});
            //Get Event Description
            convo.ask('What is the description of the event?', function(response, convo) {
                convo.next();
            }, {'key': 'description'});
            //Get Event Date And Time
            var re = '(0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])[- /.](19|20)\\\d\\\d ([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]';
            convo.ask('When will take place (format: mm/dd/yyyy hh:mm)?', [
                {
                    //Test The Date Against This RegExp To Match The Format
                    pattern: new RegExp(re, "g"),
                    callback: function(response, convo) {
                        //Get Event Location
                        convo.ask('Where will it take place?', function(response, convo) {
                            convo.next();
                        }, {'key': 'location'});
                        convo.next();
                    }
                },
                {
                    default: true,
                    callback: function(response, convo) {
                        convo.repeat();
                        convo.next();
                    }
                }
            ], {'key': 'dateTime'});
            //Send Reactions
            //End Conversation
            convo.on('end', function(convo) {
                if (convo.status == 'completed') {
                    //Create Temp Var's
                    var eTitle = convo.extractResponse('title'),
                        eDescription = convo.extractResponse('description'),
                        eLocation = convo.extractResponse('location'),
                        eDate = convo.extractResponse('dateTime').replace(/ [0-9]{2}:[0-9]{2}/, ''),
                        eTime = convo.extractResponse('dateTime').replace(/[0-9]{2}\/[0-9]{2}\/[0-9]{4} /, ''),
                        createdEventMsg = 'Awesome! Your event ' + eTitle + ' is planned!\n' + eDescription + '\nIt will take place in ' + eDate + ' ' + eTime + '\nI will communicate this to your team on #Events.\n Cheers!';
                    //New Event Message
                    bot.reply(message, createdEventMsg, function(err,response) {
                        //Broadcast Event
                        bot.api.chat.postMessage({
                            text: 'Hey there! the user X ' + 'has planned a new event: ' + eTitle +'!\n' + 'Here\'s the description of the event:\n' + eDescription + '\nTo answer, click on the good emoji below.\n You may only choose one option. to answer click on the good emoji below',
                            channel: '#general'
                        }, function(err, message) {
                            /*
                            * CRON PARA SALVAR CADA TANTO LAS REACTIONS Y TAMBIEN HAY QUE SALVAR
                            * LOS DATOS DE LOS REACTIONS EN EL EVENTO
                            * */
                            bot.api.reactions.add({
                                timestamp: message.ts,
                                channel: message.channel,
                                name: 'white_check_mark',
                            },function(err) {
                                if (err) { console.log(err) }
                            });
                            bot.api.reactions.add({
                                timestamp: message.ts,
                                channel: message.channel,
                                name: 'question',
                            },function(err) {
                                if (err) { console.log(err) }
                            });
                            bot.api.reactions.add({
                                timestamp: message.ts,
                                channel: message.channel,
                                name: 'x',
                            },function(err) {
                                if (err) { console.log(err) }
                            });
                        });

                    });
                    bot.identifyTeam(function(err,team_id) {
                        //Code to create and store the new event
                        var teamId = team_id;
                        controller.storage.events.all(function(err, all_team_data) {
                            var newId = all_team_data.length + 1,
                                event = new Event(eTitle, eDescription, eDate, eTime, eLocation, message.ts, message.channel, teamId);
                            //Botkit Method To Storage
                            if(!eventId) {
                                controller.storage.events.save({id: 'event' + newId, event_data: event}, function(err) {});
                            } else {
                                controller.storage.events.save({id: eventId, event_data: event}, function(err) {});
                            }

                        });
                    });
                } else {
                    //Handle Error
                }
            });
        });
    };
    //Listing Conversation
    var listing = function(bot, message, eventId) {
        //Check Team's Id
        bot.identifyTeam(function(err,team_id) {
            var teamId = team_id;
            //Start Conversation
            bot.startConversation(message, function(err, convo) {
                controller.storage.events.get(eventId, function(err, event_data) {
                    if(event_data != null && event_data.event_data.team_id == teamId) {
                        controller.storage.attend.get(eventId, function(err, attend_data) {
                            if(attend_data == null) {
                                //Reply
                                var reply_with_attachments = {
                                    'attachments': [
                                        {
                                            'title': 'There is no attendees for ' + event_data.event_data.title,
                                            'color': '#7CD197'
                                        }
                                    ]
                                };
                                bot.reply(message, reply_with_attachments);
                                convo.stop();
                            } else {
                                //Reply
                                console.log(attend_data);
                                var reply_with_attachments = {
                                    'attachments': [
                                        {
                                            'title': 'Here are the attendees for ' + event_data.event_data.title + '(' + Object.keys(attend_data.attend).length + ' people attending)',
                                            'color': '#7CD197'
                                        }
                                    ]
                                };
                                bot.reply(message, reply_with_attachments);
                                //Iterate Over Attend Data
                                for(var prop in attend_data.attend){
                                    bot.api.users.info({user: prop}, function(err, user) {
                                        convo.say(user.user.real_name);
                                    });
                                }
                                convo.next();
                            }
                            //convo.next();
                        });
                    } else {
                        bot.api.users.info({user: message.user}, function(err, user) {
                            convo.say('Hey, ' + user.user.real_name + ' there is no event with that ID!');
                            convo.next();
                        });
                    }
                });
            });
        });
    };
    //Listing Events
    var listEvents = function(bot, message) {
        //Start Conversation
        bot.startConversation(message, function(err, convo) {
            bot.identifyTeam(function(err,team_id) {
                var teamID = team_id;
                //Get List Of Attenddes
                controller.storage.events.all(function(err, all_events_data) {
                    //Get Today's Date
                    var date = new Date(),
                        day = date.getDate(),
                        month = date.getMonth() + 1,
                        year = date.getFullYear(),
                        formatDate = month + '/' + day + '/' + year;
                    //Iterate Over All Events
                    var eventsLength = all_events_data.length;
                    futureEvents = [];
                    for(var i=0;i<eventsLength;i++) {
                        var eventDate = all_events_data[i].event_data.date;
                        //Push Future Events Into List
                        if(new Date(eventDate) >= new Date(formatDate) && all_events_data[i].event_data.team_id == teamID) {
                            futureEvents.push(all_events_data[i]);
                        }
                    }
                    //Reply With Future Events
                    bot.startConversation(message, function(err,convo) {
                        bot.say(
                            {
                                text: 'Here are the are the upcoming events for your team:\nFor more info on an event, type "list"\+\<event_id\>\nTo attend an event, type "attend"\+\<event_id\>',
                                channel: message.channel
                            }
                        );
                        //List
                        var futureLength = futureEvents.length;
                        for(var j=0;j<futureLength;j++) {
                            bot.reply(message, {
                                "attachments": [
                                    {
                                        "pretext": 'Event ID: ' + futureEvents[j].id,
                                        "title": futureEvents[j].event_data.title,
                                        "color": '#3498db',
                                        "fields": [
                                            {
                                                "title": 'Date',
                                                "value": futureEvents[j].event_data.date,
                                                "short": true
                                            },
                                            {
                                                "title": 'Time',
                                                "value": futureEvents[j].event_data.time + 'hs',
                                                "short": true
                                            },
                                            {
                                                "title": 'Location',
                                                "value": futureEvents[j].event_data.location,
                                                "short": true
                                            }
                                        ]
                                    }
                                ]
                            });
                        }
                        //Offer More Events
                        //End Conversation
                        convo.stop();
                    });
                });
                convo.stop();
            });
        });
    };
    //Notify Upcoming Events
    var notifyUpcoming = function(bot, message, convo) {
        //Get Actual Date
        var date = new Date(),
            day = date.getDate(),
            month = date.getMonth() + 1,
            year = date.getFullYear(),
            tHour = date.getHours() + ':' + date.getMinutes(),
            today = month + '/' + day + '/' + year;
        //Check Team's Id
        bot.identifyTeam(function(err,team_id) {
            var teamID = team_id;
            //Retrieve All Events
            controller.storage.events.all(function(err, all_events_data) {
                var length = all_events_data.length,
                    teamEvents = [];
                for(var i=0;i<length;i++) {
                    if(all_events_data[i].event_data.team_id == teamID) {
                        teamEvents.push(all_events_data[i]);
                    }
                };
                //Get Future Events
                var upLength = teamEvents.length;
                for(var j=0;j<upLength;j++) {
                    var eHour = teamEvents[j].event_data.time,
                        eDate = teamEvents[j].event_data.date,
                        todayFormatted = new Date(today),
                        dateFormatted =  new Date(eDate);
                    //Compare Year And Month
                    if((todayFormatted.getFullYear() == dateFormatted.getFullYear()) && (todayFormatted.getMonth()+1 == dateFormatted.getMonth()+1)) {
                        //var daysLeft = dateFormatted.getDate() - todayFormatted.getDate();
                        var daysLeft = 7;
                        //If *daysLeft results negative it means that the event already past(ex: yesterday).
                        switch (daysLeft) {
                            case 7:
                                //Code to notify users
                                alertAttendees(bot, convo, 'The event "' + teamEvents[j].event_data.title + '" is next week!\nIt will take place on ' + teamEvents[j].event_data.date + ' ' + teamEvents[j].event_data.time + 'hs, at ' + teamEvents[j].event_data.location, teamEvents[j].id);
                            break;
                            case 1:
                                eHour = eHour.replace(':','');
                                tHour = tHour.replace(':','');
                                //var timeLeft = parseInt(parseFloat(eHour) - parseFloat(tHour));
                                var timeLeft = 100;
                                if(timeLeft == 100) {
                                    alertAttendees(bot, convo, 'Just a little reminder.\nThe event "' + teamEvents[j].event_data.title + '" starts in an hour!\nHave fun!!!', teamEvents[j].id);
                                } else {
                                    alertAttendees(bot, convo, 'Ready for tomorrow?\n"' + teamEvents[j].event_data.title + '" starts on ' + teamEvents[j].event_data.date + ' ' + teamEvents[j].event_data.time + 'hs', teamEvents[j].id);
                                }
                            break;
                        }
                    }
                };
            });
        });
    };
    //Conversation Controller "NEW EVENT"
    controller.hears('new event',['direct_message','direct_mention'],function(bot,message) {
        conversation(bot, message, false);
    });
    //Conversation Controller "EDIT EVENT"
    controller.hears('edit (.*)',['direct_message','direct_mention'],function(bot,message) {
        var eventId = message.match[1];
        //Start Conversation
        conversation(bot, message, eventId);
    });
    //Conversation Controller "ATTEND EVENT"
    controller.hears('attend (.*)',['direct_message','direct_mention'],function(bot,message) {
        //Get Event Id
        var eventId = message.match[1].replace(/\$|#|\.|\[|]/g,'');
        //Check If Event Exist
        controller.storage.events.get(eventId, function(err, event_data){
            //Check Team's Id
            bot.identifyTeam(function(err,teamId) {
                if(event_data != null && event_data.event_data.team_id == teamId) {
                    //Get User
                    var user = message.user;
                    //Get Attenddes List
                    controller.storage.attend.get(eventId, function(err, attend_data) {
                        var attend = {};
                        //Check If Attend's Already Exists
                        if (attend_data != null && typeof attend_data.attend != "undefined") {
                            attend = attend_data.attend;
                        }
                        attend[user] = true;
                        //Save Attend
                        controller.storage.attend.save({id: eventId, attend:attend}, function(err) {});
                    });
                } else {
                    bot.startConversation(message, function(err, convo) {
                        bot.api.users.info({user: message.user}, function(err, user) {
                            convo.say('Hey, ' + user.user.real_name + ' there is no event with that ID!');
                        });
                        convo.next();
                    });
                }
            });
        });
    });
    //Conversation Controller "MAYBE EVENT"
    controller.hears('maybe (.*)',['direct_message','direct_mention'],function(bot,message) {
        //Get Event Id
        var eventId = message.match[1].replace(/\$|#|\.|\[|]/g,'');
        //Check If Event Exist
        controller.storage.events.get(eventId, function(err, event_data){
            //Check Team's Id
            bot.identifyTeam(function(err,teamId) {
                if(event_data != null && event_data.event_data.team_id == teamId) {
                    //Get User
                    var user = message.user;
                    //Get Attenddes List
                    controller.storage.rsvp.get(eventId, function(err, event_data) {
                        var maybe = {};
                        //Check If Attend's Already Exists
                        if (event_data != null && typeof event_data.maybe != "undefined") {
                            maybe = event_data.maybe;
                        }
                        maybe[user] = true;
                        //Save Attend
                        controller.storage.maybe.save({id: eventId, maybe:maybe}, function(err) {});
                    });
                } else {
                    bot.startConversation(message, function(err, convo) {
                        bot.api.users.info({user: message.user}, function(err, user) {
                            convo.say('Hey, ' + user.user.real_name + ' there is no event with that ID!');
                        });
                        convo.next();
                    });
                }
            });
        });
    });
    //Conversation Controller "NO EVENT"
    controller.hears('no (.*)',['direct_message','direct_mention'],function(bot,message) {
        //Get Event Id
        var eventId = message.match[1].replace(/\$|#|\.|\[|]/g,'');
        //Check If Event Exist
        controller.storage.events.get(eventId, function(err, event_data){
            //Check Team's Id
            bot.identifyTeam(function(err,teamId) {
                if(event_data != null && event_data.event_data.team_id == teamId) {
                    //Get User
                    var user = message.user;
                    //Get Attenddes List
                    controller.storage.noAttend.get(eventId, function(err, event_data) {
                        var maybe = {};
                        //Check If Attend's Already Exists
                        if (event_data != null && typeof event_data.maybe != "undefined") {
                            maybe = event_data.maybe;
                        }
                        maybe[user] = true;
                        //Save Attend
                        controller.storage.noAttend.save({id: eventId, maybe:maybe}, function(err) {});
                    });
                } else {
                    bot.startConversation(message, function(err, convo) {
                        bot.api.users.info({user: message.user}, function(err, user) {
                            convo.say('Hey, ' + user.user.real_name + ' there is no event with that ID!');
                        });
                        convo.next();
                    });
                }
            });
        });
    });
    //Conversation Controller "LIST ATTENDS"
    controller.hears('list (.*)',['direct_message','direct_mention'],function(bot,message) {
        var eventId = message.match[1];
        //Start Conversation
        listing(bot, message, eventId);
    });
    //Conversation Controller "REACTIONS"
    controller.hears('reactions of (.*)',['direct_message','direct_mention'],function(bot,message) {
        //Start Conversation
        var eventId = message.match[1];
        //Search Event In DB
        controller.storage.events.get(eventId, function(err, event) {
            console.log(event.event_data);
            //Get Reactions
            bot.api.reactions.get({
                channel: event.event_data.mChannel,
                timestamp: event.event_data.mTimeStamp
            }, function(err, reactions) {
                console.log("El err es:" + err);
                console.log(reactions);
            });
        });
    });
    //Conversation Contoller "LIST FUTURE EVENTS"
    controller.hears(':date:',['direct_message','direct_mention'],function(bot,message) {
        listEvents(bot, message);
    });
    //Conversation Contoller "HELP"
    controller.hears('help',['direct_message','direct_mention'],function(bot,message) {
        bot.reply(message, {
            "attachments": [
                {
                    "text": "Here is how to use KoolPlanner",
                    "color": "#2980b9",
                    "mrkdwn_in": ["text", "pretext"]
                },
                {
                    "color": "danger",
                    "pretext": "To *create* a new event",
                    "text": "`new event`",
                    "mrkdwn_in": ["text", "pretext"]
                },
                {
                    "color": "danger",
                    "pretext": "Use this *emoji* to view all the **upcoming events**",
                    "text": ":date: - `(:date:)`",
                    "mrkdwn_in": ["text", "pretext"]
                },
                {
                    "color": "danger",
                    "pretext": "To view the *attendees* of an event",
                    "text": "`list [event_id]`",
                    "mrkdwn_in": ["text", "pretext"]
                },
                {
                    "color": "danger",
                    "pretext": "To *attend* an event",
                    "text": "`attend [event_id]`",
                    "mrkdwn_in": ["text", "pretext"]
                },
                {
                    "color": "danger",
                    "pretext": "To say that you *might attend* an event",
                    "text": "`maybe [event_id]`",
                    "mrkdwn_in": ["text", "pretext"]
                },
                {
                    "color": "danger",
                    "pretext": "To say that you *cannot attend* an event",
                    "text": "`no [event_id]`",
                    "mrkdwn_in": ["text", "pretext"]
                },
                {
                    "color": "danger",
                    "pretext": "To *edit* the info of an event",
                    "text": "`edit [event_id]`",
                    "mrkdwn_in": ["text", "pretext"]
                }
            ]
        });
    });
    //Conversation Contoller "DETAILS"
    controller.hears('details',['direct_message','direct_mention', 'mention'],function(bot,message) {
        bot.reply(message, {
            "attachments": [
                {
                    "fallback": "How it works",
                    "color": "#36a64f",
                    "pretext": "Hey there!:wave: Here is how it works! :nerd_face:\n*1- Create/Edit an event*",
                    "author_name": "Create an event",
                    "text": "Type `new event` in *Direct Message* to start the process of creating an event.\nI will ask you a title, a description, date&time and a location.\nThe event will be created with a _unique_ *event_id*. I will broadcast a message here to notify the team. :loudspeaker:",
                    "mrkdwn_in": ["text", "pretext"]
                },
                {
                    "fallback": "Required plain-text summary of the attachment.",
                    "color": "#36a64f",
                    "pretext": " ",
                    "author_name": "Edit an event",
                    "text": "Type `edit <event_id>` to edit the info of an event. :gear:",
                    "mrkdwn_in": ["text", "pretext"]
                },
                {
                    "fallback": "Required plain-text summary of the attachment.",
                    "color": "#70cadb",
                    "pretext": "*2- Respond to an invitation*",
                    "text": "Answer directly by clicking on the *Emoji Reaction* below a message :white_check_mark: :question: :x:\nor:  Type `attend <event_id>` to attend an event :white_check_mark:\n\t\tType `maybe <event_id>` to say that you might go to an event :question:\n\t\tType `no <event_id>` if you cannot go :x:\n",
                    "mrkdwn_in": ["text", "pretext"]
                },
                {
                    "fallback": "Required plain-text summary of the attachment.",
                    "color": "#443642",
                    "pretext": "*3- Lists*",
                    "author_name": "See the list of events",
                    "text": "Use the :date: emoji (`:date:`) to view all upcoming events from your team. :date:",
                    "mrkdwn_in": ["text", "pretext"]
                },
                {
                    "fallback": "Required plain-text summary of the attachment.",
                    "color": "#443642",
                    "pretext": " ",
                    "author_name": "View the list of attendees",
                    "text": "Type `list <event_id>` to view the list of attendees of an event. :clipboard:",
                    "mrkdwn_in": ["text", "pretext"]
                },
                {
                    "fallback": "Required plain-text summary of the attachment.",
                    "color": "#e8a723",
                    "pretext": "Type `help` for the list of commands.\n:tada::spiral_calendar_pad::calendar:Start planning awesome events!:calendar::spiral_calendar_pad::tada:",
                    "text": "",
                    "mrkdwn_in": ["text", "pretext"]
                }
            ]
        });
    });
    //Event "JOIN"
    controller.on('channel_joined',function(bot,message) {
        console.log(message);
        //Onboarding Message Here
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
            "channel": message.channel.id
        });
    });
    //Scheduled Function To Notify Users For An Upcoming Event
    controller.hears('notify',['direct_message','direct_mention'],function(bot,message) {
        bot.startConversation(message, function(err, convo) {
            notifyUpcoming(bot, message, convo);
        });
    });
};
