const { Collection } = require('discord.js');
const Logger = require('../Logger.js');
const config = require('#root/config.js').getConfig();
const axios = require('axios');
const fs = require('fs');

class CommandHandler {
    constructor(minecraft) {
        this.minecraft = minecraft;

        this.prefix = config.minecraft.bot.prefix;
        this.commands = new Collection();

        const commandFiles = fs.readdirSync('./src/minecraft/commands').filter((file) => file.endsWith('.js'));
        for (const file of commandFiles) {
            const command = new (require(`./commands/${file}`))(minecraft);

            this.commands.set(command.name, command);
        }
    }

    handle(player, message, command_channel = 'gc') {
        if (message.startsWith(this.prefix)) {
            if (config.minecraft.commands.normal === false) {
                return;
            }

            const args = message.slice(this.prefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();
            const command =
                this.commands.get(commandName) ??
                this.commands.find((cmd) => cmd.aliases && cmd.aliases.includes(commandName));

            if (command === undefined) {
                return;
            }

            Logger.minecraftMessage(`${player} - [${command.name}] ${message}`);
            command.onCommand(player, message, command_channel);
        } else if (message.startsWith('-') && message.startsWith('- ') === false) {
            if (config.minecraft.commands.soopy === false || message.at(1) === '-') {
                return;
            }

            const command = message.slice(1).split(' ')[0];
            if (isNaN(parseInt(command.replace(/[^-()\d/*+.]/g, ''))) === false) {
                return;
            }

            Logger.minecraftMessage(`${player} - [${command}] ${message}`);
            bot.chat(`/gc [SOOPY V2] ${player}, wait a bit...`);

            (async () => {
                try {
                    const URI = encodeURI(
                        `https://soopy.dev/api/guildBot/runCommand?user=${player}&cmd=${message.slice(1)}`
                    );
                    const response = await axios.get(URI);

                    if (response?.data?.msg === undefined) {
                        return bot.chat(`/gc [SOOPY V2] An error occured while running the command`);
                    }

                    bot.chat(`/gc [SOOPY V2] ${response.data.msg}`);
                } catch (e) {
                    bot.chat(`/gc [SOOPY V2] ${e.cause ?? e.message ?? 'Unknown error'}`);
                }
            })();
        }
    }
}

module.exports = CommandHandler;
