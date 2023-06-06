const tmi = require('tmi.js');
require('dotenv').config();
var RiveScript = require("rivescript");
var bot = new RiveScript();
var fs = require('fs');
var util = require('util');

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

    // Only reply to messages that start with @Zyxalthur
    if (!message.includes('@Zyxalthur')) return;

    // Prepare the message content for the bot
    message = message.replace('@Zyxalthur', '').trim();
    message = message.toLowerCase();
    message = message.replace(/[^a-z ]/gi, '');

    console.log("Input received: " + message);
    
    // Get a reply from the bot
    var reply = bot.reply(tags.username, message);
    console.log("Bot response: " + reply);
    
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
            // Reply to the user
            client.say(channel, `@${tags.username} ${reply}`);
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
