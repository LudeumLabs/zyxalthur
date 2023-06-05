const tmi = require('tmi.js');
require('dotenv').config();
var RiveScript = require("rivescript");
var bot = new RiveScript();
var fs = require('fs');
var util = require('util');
const { timeStamp } = require('console');

// create logs directory
if (!fs.existsSync(__dirname + '/logs')) {
    fs.mkdirSync(__dirname + '/logs');
}
var log_file = fs.createWriteStream(__dirname + `/logs/session_${Date.now()}.log`, {flags : 'w'});
var log_stdout = process.stdout;

console.log = function(d) { //
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

client.connect().catch(console.error);

client.on('message', (channel, tags, message, self) => {
    if (self) return;
    if (!message.includes('@Zyxalthur')) return;

    message = message.replace('@Zyxalthur', '').trim();
    message = message.toLowerCase();
    message = message.replace(/[^a-z ]/gi, '')
    
    bot.sortReplies();

    console.log("Input received: " + message);

    var reply = bot.reply(tags.username, message);
    console.log("Bot response: " + reply);

    if(reply.startsWith("ERR")) {
        console.log(reply);
        return;
    } 

    else 
    {
        try 
        {
            client.say(channel, `@${tags.username} ${reply}`);
        }

        catch (error) 
        {
            console.error(error);
        }
    }
});

client.on("connected", (address, port) => {
    console.log(`Connected to ${address}:${port}`);
    client.say(`${process.env.TWITCH_CHANNEL}`, "Behold, I am alive!");
});

client.on("ping", () => {
    console.log("Ping received from Twitch");
    client.emit("pong");
});
