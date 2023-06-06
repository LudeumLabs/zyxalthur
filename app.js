const tmi = require('tmi.js');
require('dotenv').config();
var RiveScript = require("rivescript");
var bot = new RiveScript();
var fs = require('fs');
var util = require('util');

const responseDelayMin = 1000;
const responseDelayMax = 2000;

var streamStart = 0;
var online = false;

if (!fs.existsSync(__dirname + '/logs')) {
    fs.mkdirSync(__dirname + '/logs');
}
var log_file = fs.createWriteStream(__dirname + `/logs/session_${Date.now()}.log`, {flags : 'w'});
var log_stdout = process.stdout;

console.log = function(d) {
  log_file.write(util.format(d) + '\n');
  log_stdout.write(util.format(d) + '\n');
};

bot.loadDirectory("brain");

const client = new tmi.Client({
    options: { debug: true, messagesLogLevel: "info" },
    connection: {
        reconnect: true,
        secure: true
    },

    identity: {
        username: `${process.env.TWITCH_USERNAME}`,
        password: `oauth:${process.env.TWITCH_OAUTH}`
    },
    channels: [`${process.env.TWITCH_CHANNEL}`]
});

// If the user is a mod or the streamer, listen to the command
function shouldListenToCommand(tags, channel)
{
    return (tags.mod || tags.username === channel.replace('#', ''));
}

client.connect().then((data) => {
    console.log(`Connected to ${data[0]}:${data[1]}`);
}).catch(console.error);


client.on('message', (channel, tags, message, self) => {
    // Ignore echoed messages.
    if (self) return;

    // Turn on the bot when the streamer or a mod types !streamon
    if (message === "!streamon"  && !online && shouldListenToCommand(tags, channel))
    {
        online = true;
        bot.sortReplies();
        streamStart = Date.now();
        client.say(channel, "It has begun.");
        return;
    }
    
    // Don't listen to commands or messages if the bot is offline
    if (!online) return;
    
    // Turn off the bot when the streamer or a mod types !streamoff
    if (message === "!streamoff" && shouldListenToCommand(tags, channel))
    {
        online = false;
        client.say(channel, "It is finished.");
        client.disconnect();
        return;
    }

    // Get the uptime of the stream
    if (message === "!uptime")
    {
        var uptime = Math.floor((Date.now() - streamStart) / 1000);
        var hours = Math.floor(uptime / 3600);
        var minutes = Math.floor((uptime - (hours * 3600)) / 60);
        var seconds = uptime - (hours * 3600) - (minutes * 60);

        if (hours > 0)
            client.say(channel, `Stream has been up for: ${hours} hours, ${minutes} minutes, ${seconds} seconds`);
        else if (minutes > 0)
            client.say(channel, `Stream has been up for: ${minutes} minutes, ${seconds} seconds`);
        else
            client.say(channel, `Stream has been up for: ${seconds} seconds`);
        return;
    }

    // Only reply to messages that start with @Zyxalthur
    if (!message.includes('@Zyxalthur')) return;

    // Prepare the message content for the bot
    message = message.replace('@Zyxalthur', '').trim();
    message = message.replace('  ', ' ');
    message = message.toLowerCase();
    message = message.replace(/[^a-z ]/gi, '');

    // Get a reply from the bot
    console.log("Input: " + message);
    var reply = bot.reply(tags.username, message);
    console.log("Output: " + reply);
    // If the bot returns an error, log it and don't reply
    if(reply.startsWith("ERR")) 
    {
        console.error(reply);
        return;
    }
    else 
    {
        try 
        {
            var baseDelay = Math.floor(Math.random() * (responseDelayMax - responseDelayMin + 1)) + responseDelayMin;
            var waitTime =  baseDelay * (reply.split(" ").length / 10);
            setTimeout(function() {
                if (reply !== "")
                    client.say(channel, `@${tags.username} ${reply}`);
            }, waitTime);
        }
        catch (error) 
        {
            console.error(error);
        }
    }
});

client.on("ping", () => {
    console.log("Ping received from Twitch");
    client.emit("pong");
});
