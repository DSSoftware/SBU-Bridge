const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const helperFunctions = require('./helperFunctions.js');
const config = require('../../config.js');
const Logger = require('#root/src/Logger.js');

class minecraftCommand {
    constructor(minecraft) {
        this.minecraft = minecraft;
    }

    getCommandType(message) {
        const args = message.split(' ');

        return (args[0] ?? "").toLowerCase();
    }

    getArgs(message) {
        const args = message.split(' ');

        args.shift();

        return args;
    }

    async sendDiscordFollowup(channel, content, img_array) {
        let followup_channel = config.discord.channels.officerChannel;
        let replica_channel = config.discord.replication.channels.officer;

        if (channel == 'gc') {
            followup_channel = config.discord.channels.guildChatChannel;
            replica_channel = config.discord.replication.channels.guild;
        }

        if(!config.minecraft.API.useImgur){
            let files = [];
            for(let file of img_array){
                files.push({
                    attachment: file,
                    name: 'commandResponse.png'
                })
            }
            if(img_array.length != 0){
                try{
                    await client.channels.cache.get(followup_channel).send({
                        files: files
                    });
                    await replication_client.channels.cache.get(replica_channel).send({
                        files: files
                    });
                }
                catch(e){
                    Logger.warnMessage(e);
                }
            }
            
            return;
        }

        try {
            await client.channels.cache.get(followup_channel).send(content);
        } catch (e) {
            Logger.warnMessage(e);
        }

        try {
            await replication_client.channels.cache.get(replica_channel).send(content);
        } catch (e) {
            Logger.warnMessage(e);
        }
    }

    send(message, n = 1) {
        if (bot === undefined && bot._client.chat === undefined) {
            return;
        }

        const listener = async (msg) => {
            if (
                msg.toString().includes('You are sending commands too fast! Please slow down.') &&
                !msg.toString().includes(':')
            ) {
                bot.removeListener('message', listener);
                return;
            } else if (
                msg.toString().includes('You cannot say the same message twice!') === true &&
                msg.toString().includes(':') === false
            ) {
                bot.removeListener('message', listener);
                n++;

                if (n >= 3) {
                    return;
                }

                await delay(250);
                return this.send(
                    `${message} - ${helperFunctions.generateID(config.minecraft.bot.messageRepeatBypassLength)}`,
                    n + 1
                );
            }
        };

        bot.once('message', listener);
        bot.chat(message);

        setTimeout(() => {
            bot.removeListener('message', listener);
        }, 500);
    }

    onCommand(player, message) {
        throw new Error('Command onCommand method is not implemented yet!');
    }
}

module.exports = minecraftCommand;
