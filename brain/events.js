module.exports.init = function(controller) {
    /* === CONSTRUCTORS === */
    //Event Constructor
    var Event = function(name, description, date, time, location, mTimeStamp, mChannel, teamId, userId) {
        this.title = name;
        this.description = description;
        this.date = date;
        this.time = time;
        this.location = location;
        this.mTimeStamp = mTimeStamp;
        this.mChannel = mChannel;
        this.team_id = teamId;
        this.user_id = userId;
    };
    /* === FUNCTIONS === */
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
                        convo.say('Hey ' + user.user.name + '!\n' + customMessage);
                    });
                });
            }
        });
        convo.next();
    }
    //Validate User
    function validateUser(bot,message,eventId) {
        //Check Team ID
        controller.storage.events.get(eventId, function(err, event_data){
            if(message.user == event_data.event_data.user_id) {
                createEvent(bot, message, eventId);
            } else {
                bot.reply(message, 'This is not the event you\'re looking for...');
            }
        });
    };
    //Year Of Event
    function yearOfEvent(data, bot, message) {
        //Set Present And Event Date Time
        //CODEEEEE
        var date = data.replace(/ [0-9]{2}:[0-9]{2}/, ''),
            dateMonth = date.replace(/\/[0-9]{2}/,''),
            dateDay = date.replace(/[0-9]{2}\//,''),
            present = new Date(),
            presentYear = present.getFullYear(),
            presentMonth = present.getMonth()+1,
            presentDay = present.getUTCDate();
        //Check If The Month And Year Has Passed
        if(dateMonth < presentMonth && dateDay < presentDay) {
            //Return The Year +1 (The Event Is Next Year)
            presentYear++;
            return date + '/' + presentYear;
        } else if(dateMonth == presentMonth && dateDay < presentDay) {
            //Return The Year +1 (The Event Is Next Year)
            presentYear++;
            return date + '/' + presentYear;
        } else {
            //Return The Current Year
            return date + '/' + presentYear;
        }
    }
    //Attend Function
    function attend(eventId,bot,message) {
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
                    bot.api.users.info({user: message.user}, function(err, user) {
                        //Get User's Name
                        var userName = user.user.name,
                            userId = user.user.id;
                        //Call To Check User's RSVP Last Action
                        checkRSVP(eventId,userName,userId,'attend',bot,message);
                    });
                } else {
                    bot.startConversation(message, function(err, convo) {
                        bot.api.users.info({user: message.user}, function(err, user) {
                            convo.say('Hey, ' + user.user.name + ' there is no event with that ID!');
                        });
                        convo.next();
                    });
                }
            });
        });
    }
    //Maybe Function
    function maybe(eventId,bot,message) {
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
                    bot.api.users.info({user: message.user}, function(err, user) {
                        //Get User's Name
                        var userName = user.user.name,
                            userId = user.user.id;
                        //Call To Check User's RSVP Last Action
                        checkRSVP(eventId,userName,userId,'maybe',bot,message);
                    });
                } else {
                    bot.startConversation(message, function(err, convo) {
                        bot.api.users.info({user: message.user}, function(err, user) {
                            convo.say('Hey, ' + user.user.name + ' there is no event with that ID!');
                        });
                        convo.next();
                    });
                }
            });
        });
    }
    //No Function
    function noAttend(eventId,bot,message) {
        //Check If Event Exist
        controller.storage.events.get(eventId, function(err, event_data){
            //Check Team's Id
            bot.identifyTeam(function(err,teamId) {
                if(event_data != null && event_data.event_data.team_id == teamId) {
                    //Get User
                    var user = message.user;
                    //Get Attenddes List
                    controller.storage.noAttend.get(eventId, function(err, event_data) {
                        var no_attend = {};
                        //Check If Attend's Already Exists
                        if (event_data != null && typeof event_data.no_attend != "undefined") {
                            no_attend = event_data.no_attend;
                        }
                        no_attend[user] = true;
                        //Save Attend
                        controller.storage.noAttend.save({id: eventId, no_attend:no_attend}, function(err) {});
                    });
                    bot.api.users.info({user: message.user}, function(err, user) {
                        //Get User's Name
                        var userName = user.user.name,
                            userId = user.user.id;
                        //Call To Check User's RSVP Last Action
                        checkRSVP(eventId,userName,userId,'no',bot,message);
                    });
                } else {
                    bot.startConversation(message, function(err, convo) {
                        bot.api.users.info({user: message.user}, function(err, user) {
                            convo.say('Hey, ' + user.user.name + ' there is no event with that ID!');
                        });
                        convo.next();
                    });
                }
            });
        });
    }
    //Check User's RSVP Last Action
    function checkRSVP(eventId,userName,userId,desition,bot,message) {
        //Get User ID and RSVP Choice
        var user = userName,
            userID = userId,
            eventId = eventId,
            rsvp = desition;
        //Check Desition
        if(rsvp == 'attend') {
            //Set RSVP - Maybe User To FALSE
            controller.storage.rsvp.get(eventId, function(err, event_data) {
                var maybe = {};
                //Check If Attend's Already Exists
                if (event_data != null && typeof event_data.maybe != "undefined") {
                    maybe = event_data.maybe;
                }
                maybe[userID] = false;
                //Save Attend
                controller.storage.maybe.save({id: eventId, maybe:maybe}, function(err) {});
            });
            //Set RSVP - noAttend User To FALSE
            controller.storage.events.get(eventId, function(err, event_data){
                //Check Team's Id
                controller.storage.rsvp.get(eventId, function(err, event_data) {
                    var no_attend = {};
                    //Check If Attend's Already Exists
                    if (event_data != null && typeof event_data.maybe != "undefined") {
                        no_attend = event_data.no_attend;
                    }
                    no_attend[userID] = false;
                    //Save Attend
                    controller.storage.noAttend.save({id: eventId, no_attend:no_attend}, function(err) {});
                });
            });
            //Reply With Message
            bot.reply(message, 'Got it, you’re attending ' + eventId);
        } else if(rsvp == 'maybe') {
            //Set RSVP - Attend User To FALSE
            controller.storage.attend.get(eventId, function(err, attend_data) {
                var attend = {};
                //Check If Attend's Already Exists
                if (attend_data != null && typeof attend_data.attend != "undefined") {
                    attend = attend_data.attend;
                }
                attend[userID] = false;
                //Save Attend
                controller.storage.attend.save({id: eventId, attend:attend}, function(err) {});
            });
            //Set RSVP - noAttend User To FALSE
            controller.storage.rsvp.get(eventId, function(err, event_data) {
                var no_attend = {};
                //Check If Attend's Already Exists
                if (event_data != null && typeof event_data.maybe != "undefined") {
                    no_attend = event_data.no_attend;
                }
                no_attend[userID] = false;
                //Save Attend
                controller.storage.noAttend.save({id: eventId, no_attend:no_attend}, function(err) {});
            });
            //Reply With Message
            bot.reply(message, 'Ok, don’t forget to update your participation.');
        } else if(rsvp == 'no') {
            //Set RSVP - Attend User To FALSE
            controller.storage.attend.get(eventId, function(err, attend_data) {
                var attend = {};
                //Check If Attend's Already Exists
                if (attend_data != null && typeof attend_data.attend != "undefined") {
                    attend = attend_data.attend;
                }
                attend[userID] = false;
                //Save Attend
                controller.storage.attend.save({id: eventId, attend:attend}, function(err) {});
            });
            //Set RSVP - Maybe User To FALSE
            controller.storage.rsvp.get(eventId, function(err, event_data) {
                var maybe = {};
                //Check If Attend's Already Exists
                if (event_data != null && typeof event_data.maybe != "undefined") {
                    maybe = event_data.maybe;
                }
                maybe[userID] = false;
                //Save Attend
                controller.storage.maybe.save({id: eventId, maybe:maybe}, function(err) {});
            });
            //Reply With Message
            bot.reply(message,'Too bad, you will miss a hell of an event!');
        }
    }
    /* === BOT CONVERSATIONS === */
    //Creation, Editing and Attend Conversation
    var createEvent = function (bot, message, eventId) {
        //Start Conversation
        bot.startConversation(message, function(err, convo) {
            var userName = '',
                userId = '';
            bot.api.users.info({user: message.user}, function(err, user) {
                userName = user.user.name;
                userId = user.user.id;
            });
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
            var re = '(0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01]) (0[0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]';
            convo.ask('When will take place (format: mm/dd hh:mm)?', [
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
                        eDate = yearOfEvent(convo.extractResponse('dateTime'), bot, message),
                        eTime = convo.extractResponse('dateTime').replace(/[0-9]{2}\/[0-9]{2} /, ''),
                        createdEventMsg = 'Awesome! Your event *' + eTitle + '* is planned!\n' + eDescription + '\nIt will take place on *' + eDate + '* at *' + eTime + '* in *' + eLocation +'*\nI will communicate this to your team on the channel.\n Cheers!';
                    bot.identifyTeam(function(err,team_id) {
                        //Code to create and store the new event
                        var teamId = team_id;
                        controller.storage.events.all(function(err, all_team_data) {
                            //Botkit Method To Storage
                            if(!eventId) {
                                //New Event Message
                                bot.reply(message, {
                                    "attachments": [{
                                        "text": createdEventMsg,
                                        "mrkdwn_in": ["text", "pretext"]
                                    }]
                                }, function(err,response) {
                                    //Broadcast Event
                                    bot.api.chat.postMessage({
                                        "attachments": [{
                                            "fallback": 'Hey there! the user _' + userName + '_ has planned a new event: *' + eTitle +'*!\n',
                                            "text": 'Hey there! the user _' + userName + '_ has planned a new event: *' + eTitle +'*!\n' + '_<< ' + eDescription + ' >>_\n' + 'It will take place on *' + eDate + '* at *' + eTime + '* in *' + eLocation + '*\nTo answer, click on the good emoji below.\n You may only *choose one option*.',
                                            "mrkdwn_in": ["text", "pretext"]
                                        }],
                                        channel: '#general'
                                    }, function(err, message) {
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
                                        var newId = all_team_data.length + 1,
                                            event = new Event(eTitle, eDescription, eDate, eTime, eLocation, message.ts, message.channel, teamId, userId);
                                        event.mTimeStamp = message.ts;
                                        controller.storage.events.save({id: 'event' + newId, event_data: event}, function(err) {});
                                    });
                                });
                            } else {
                                //Edit Event Message
                                bot.reply(message, {
                                    "attachments": [{
                                        "text": createdEventMsg,
                                        "mrkdwn_in": ["text", "pretext"]
                                    }]
                                }, function(err,response) {
                                    //Broadcast Event
                                    bot.api.chat.postMessage({
                                        "attachments": [{
                                            "fallback": 'Hey there! the user _' + userName + '_ has *edited* the event: *' + eTitle +'*!\n',
                                            "text": 'Hey there! the user _' + userName + '_ has *edited* the event: *' + eTitle +'*!\n' + '_<< ' + eDescription + ' >>_\n' + 'It will take place on *' + eDate + '* at *' + eTime + '* in *' + eLocation + '*\nTo answer, click on the good emoji below.\n You may only *choose one option*.',
                                            "mrkdwn_in": ["text", "pretext"]
                                        }],
                                        channel: '#general'
                                    }, function(err, message) {
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
                                    //Save
                                    event.mTimeStamp = message.ts;
                                    controller.storage.events.save({id: eventId, event_data: event}, function(err) {});
                                });
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
    var listAttends = function(bot, message, eventId) {
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
                                //Check No Attend Users
                                var noAttendees = 0;
                                for(var user in attend_data.attend){
                                    if(attend_data.attend[user] === false) {
                                        noAttendees++;
                                    }
                                }
                                if(Object.keys(attend_data.attend).length == noAttendees) {
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
                                    var attendUsers = 0;
                                    //Iterate Over Attend Data
                                    for(var prop in attend_data.attend){
                                        if(attend_data.attend[prop] == true) {
                                            attendUsers++;
                                            bot.api.users.info({user: prop}, function(err, user) {
                                                convo.say(user.user.name);
                                            });
                                        }
                                    }
                                    //Reply
                                    var reply_with_attachments = {
                                        'attachments': [
                                            {
                                                'title': 'Here are the attendees for ' + event_data.event_data.title + ' (' + attendUsers + ' people attending)',
                                                'color': '#7CD197'
                                            }
                                        ]
                                    };
                                    bot.reply(message, reply_with_attachments);
                                    convo.next();
                                }
                            }
                        });
                    } else {
                        bot.api.users.info({user: message.user}, function(err, user) {
                            convo.say('Hey, ' + user.user.name + ' there is no event with that ID!');
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
                                text: 'Here are the are the upcoming events for your team:\n',
                                channel: message.channel
                            }
                        );
                        //List
                        var futureLength = futureEvents.length;
                        for(var j=0;j<futureLength;j++) {
                            bot.reply(message, {
                                "attachments": [
                                    {
                                        "fallback": futureEvents[j].event_data.title,
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
    /* === CONTROLLERS === */
    //Conversation Controller "NEW EVENT"
    controller.hears('new event',['direct_message','direct_mention'],function(bot,message) {
        createEvent(bot, message, false);
    });
    //Conversation Controller "EDIT EVENT"
    controller.hears('edit (.*)',['direct_message','direct_mention'],function(bot,message) {
        //Get Event ID
        var eventId = message.match[1];
        //Check If Event Exist
        controller.storage.events.get(eventId, function(err, event_data) {
            if(event_data != null) {
                //Call To Validate User Function
                validateUser(bot,message,eventId);
            } else {
                //Reply With Message
                bot.api.users.info({user: message.user}, function(err, user) {
                    bot.reply(message, 'Hey, ' + user.user.name + ' there is no event with that ID!');
                });
            }
        });
    });
    //Conversation Controller "ATTEND EVENT"
    controller.hears('attend (.*)',['direct_message','direct_mention'],function(bot,message) {
        //Get Event Id
        var eventId = message.match[1].replace(/\$|#|\.|\[|]/g,'');
        //Call To Attend Function
        attend(eventId,bot,message);
    });
    //Conversation Controller "MAYBE EVENT"
    controller.hears('maybe (.*)',['direct_message','direct_mention'],function(bot,message) {
        //Get Event Id
        var eventId = message.match[1].replace(/\$|#|\.|\[|]/g,'');
        //Call To Maybe Function
        maybe(eventId,bot,message);
    });
    //Conversation Controller "NO EVENT"
    controller.hears('no (.*)',['direct_message','direct_mention'],function(bot,message) {
        //Get Event Id
        var eventId = message.match[1].replace(/\$|#|\.|\[|]/g,'');
        //Call To No Attend Function
        noAttend(eventId,bot,message);
    });
    //Conversation Controller "LIST ATTENDS"
    controller.hears('list (.*)',['direct_message','direct_mention'],function(bot,message) {
        var eventId = message.match[1];
        //Start Conversation
        listAttends(bot, message, eventId);
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
                    "fallback": "How it works",
                    "color": "#36a64f",
                    "pretext": "Here is how to use KoolPlanner\n*Create/Edit an event*",
                    "author_name": "Create an event",
                    "text": "Type `new event` to start the process of creating an event.",
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
                    "pretext": "*Respond to an invitation*",
                    "text": "Answer directly by clicking on the *Emoji Reaction* below a message :white_check_mark: :question: :x:\nor:  Type `attend <event_id>` to attend an event :white_check_mark:\n\t\tType `maybe <event_id>` to say that you might go to an event :question:\n\t\tType `no <event_id>` if you cannot go :x:\n",
                    "mrkdwn_in": ["text", "pretext"]
                },
                {
                    "fallback": "Required plain-text summary of the attachment.",
                    "color": "#443642",
                    "pretext": "*Lists*",
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
    //User Reactions To Events
    controller.on('reaction_added', function(bot, message) {
        //Look For Events With Correct Time Stamp
        controller.storage.events.all(function(err, all_events_data) {
            //Iterate Over All Events
            var length = all_events_data.length;
            for(var i=0; i<length; i++) {
                if(message.item.ts == all_events_data[i].event_data.mTimeStamp) {
                    //Save User's Desition
                    if(message.reaction == 'white_check_mark') {
                        attend(all_events_data[i].id, bot, message);
                    } else if(message.reaction == 'question') {
                        maybe(all_events_data[i].id,bot,message);
                    } else if(message.reaction == 'x') {
                        noAttend(all_events_data[i].id,bot,message);
                    }
                }
            }
        });
    });
};

module.exports.notify = function(controller, bot) {


        //Alert Attendess User
    function alertAttendeesToEvent(bot, customMessage, eventId) {
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
                        convo.say('Hey ' + user.user.name + '!\n' + customMessage);
                    });
                });
            }
        });
    }

    //Get Actual Date
    /* Here we create the actual date to compare agains the event's date's */
    var date = new Date(),
        day = date.getDate(),
        month = date.getMonth() + 1,
        year = date.getFullYear(),
        tTime = date.getHours() + ':' + date.getMinutes(),
        today = month + '/' + day + '/' + year;
        var teamID = bot.resource.SlackTeamID;
        bot = bot.worker;

        console.log('Today\s date is:' + today);
        /* Get all  the events from FireBase */
         controller.storage.events.all(function(err, all_events_data) {
            var length = all_events_data.length,
                teamEvents = [];
            for(var i=0;i<length;i++) {
                /* Get specific events by team's id */
                if(all_events_data[i].event_data.team_id == teamID) {
                    teamEvents.push(all_events_data[i]);
                }
                console.dir('Event date is:' + all_events_data[i].event_data.date);
            };
            //Get Future Events
            var upLength = teamEvents.length;
             console.dir('Los eventos del team son: ' + teamEvents);
             /* Iterate over the team event's */
            for(var j=0;j<upLength;j++) {
                /* Here we get the time(hh/mm) and date(mm/dd) of the event */
                var eTime = teamEvents[j].event_data.time,
                    eDate = teamEvents[j].event_data.date,
                    /* Format the data with JS Date Obj so we can compare against actual date later */
                    todayFormatted = new Date(today),
                    dateFormatted =  new Date(eDate);
                /* Compare Year And Month */
                if((todayFormatted.getFullYear() == dateFormatted.getFullYear()) && (todayFormatted.getMonth()+1 == dateFormatted.getMonth()+1)) {
                    /* Get the days remaining to event, if *daysLeft results negative it means that the event already past(ex: yesterday). */
                    var daysLeft = dateFormatted.getDate() - todayFormatted.getDate();
                    /* In case 7 we are a week from the event */
                    switch (daysLeft) {
                        case 7:
                            //Code to notify users
                            alertAttendeesToEvent(bot, 'The event "' + teamEvents[j].event_data.title + '" is next week!\nIt will take place on ' + teamEvents[j].event_data.date + ' ' + teamEvents[j].event_data.time + 'hs, at ' + teamEvents[j].event_data.location, teamEvents[j].id);
                        break;
                        case 1:
                            alertAttendeesToEvent(bot, 'Ready for tomorrow?\n"' + teamEvents[j].event_data.title + '" starts on ' + teamEvents[j].event_data.date + ' ' + teamEvents[j].event_data.time + 'hs', teamEvents[j].id);
                        break;
                        case 0:
                            /* In case 0 this is the day of the event and now we have to compare time */
                            if (tTime > eTime) {
                                var timeLeft = parseInt(tTime - eTime);
                                if(timeLeft == 1) {
                                    alertAttendeesToEvent(bot, 'Just a little reminder.\nThe event "' + teamEvents[j].event_data.title + '" starts in an hour!\nHave fun!!!', teamEvents[j].id);
                                }

                            }
                        break;
                    }
                }
            };
        });

};

