const Discord = require("discord.js"); // Load Discord JS modules
const config = require("./config.json"); // Discord bot token
const client = new Discord.Client(); // Connect to Discord
const commands = require("./functions/commands.js"); // All commands.
const schedule = require("./functions/schedule.js"); // Schedule function.
const sanitizer = require("string-sanitizer"); // NPM string sanitizer
const dateFormat = require("dateformat"); // Dateformat package

// Multiple variables
const prefix = "!cal ";
const ver = "1.0";
const inv = "https://discord.com/"; // Your discord's bot invite link


// DB
const mysql = require('mysql2');
const pool = mysql.createPool({
    host     : 'host',
    database : 'DB',
    user     : 'user',
    password : 'password',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    supportBigNumbers: true,
    bigNumberStrings: true
});

const promisePool = pool.promise();

client.on("ready", () => {
    let servers = client.guilds.cache.size;
    client.user.setActivity(`Ayudando en ${servers} servidores`, {type: "PLAYING"});
    pool.query("SELECT * FROM events where eventDate > sysdate()", function(err, rows, fields){
        if (err) {return;}
        rows.forEach(row => {
            schedule.scheduler(row, client);
        });
    })
    console.log("Ready");
})

client.on("message", async function(message) {
    if (message.author.bot) return; // Avoid reading messages from bots

    // Adding user to DB if not exists
    let user = message.author.id;
    let sql = `INSERT INTO users (id, updated_at) VALUES (?, ?) ON DUPLICATE KEY UPDATE updated_at = ?`;
    pool.query(sql, [user, new Date, new Date], function(error, results, fields) {});
    

    // React on mention
    if (/<@!ID>|<@ID>/.test(message.content)) {
        return message.channel.send(`¡Hola! Siéntete libre de usarme con el prefijo \`${prefix}\`. Puedes aprender más sobre mi con \`${prefix}help\`.`);
    }

    if (!message.content.startsWith(prefix)) return; // Avoid reading messages that does NOT start with the prefix

    const commandBody = message.content.slice(prefix.length); // Save on commandBody the whole command, without prefix
    const args = commandBody.split(' '); // Save on args the different parts of the command
    const command = args.shift().toLowerCase(); // Delete first item on args and convert to lowecase the whole command.

    // COMMANDS
    // Ping
    if (command === "ping") {
        commands.ping(message);
    } 

    // Version
    else if (command === "version") {
        commands.version(message, ver);
    }

    // Invite command
    else if (command === "invite") {
        commands.invite(message, inv);
    }

    // Add event
    else if (command === "add") {
        commands.add(message, args, mysql, pool, prefix, user, client);
    }

    // Show events
    else if (command === "events") {
        commands.events(message, promisePool);
    }

    // Help
    else if (command === "help") {
        commands.help(message, args, prefix);
    }
    
});

client.login(config.BOT_TOKEN); // Login into the Discord bot
