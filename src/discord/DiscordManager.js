const { replaceVariables } = require('../contracts/helperFunctions.js');

class DiscordManager extends CommunicationBridge {

    async getWebhook(discord, type) {
        const channel = await this.stateHandler.getChannel(type);
        const webhooks = await channel.fetchWebhooks();

        if (webhooks.size === 0) {
            channel.createWebhook({
                name: 'Hypixel Chat Bridge',
                avatar: 'https://imgur.com/tgwQJTX.png'
            });

            await this.getWebhook(discord, type);
        }

        return webhooks.first();
    }

    async onBroadcast({ fullMessage, chat, chatType, username, rank, guildRank, message, color = 8421504 }) {
        try{
            if (chat == 'Guild/Replication') {
                chat = 'Guild'; // Inter Discord Communication Support
                guildRank = 'Inter-Discord';
            }
            if (chat == 'Officer/Replication') {
                chat = 'Officer'; // Inter Discord Communication Support
                guildRank = 'Inter-Discord';
            }
            if (chat == 'Debug') {
                return;
            }
    
            if (
                (chat === undefined && chatType !== 'debugChannel') ||
                ((username === undefined || message === undefined) && chat !== 'debugChannel')
            ) {
                return;
            }
    
            const mode = chat === 'debugChannel' ? 'minecraft' : config.bot.other.messageMode.toLowerCase();
    
            message = chat === 'debugChannel' ? fullMessage : message;
            if (message !== undefined && chat !== 'debugChannel') {
                Logger.broadcastMessage(
                    `${username} [${(guildRank ?? '').replace(/§[0-9a-fk-or]/g, '').replace(/^\[|\]$/g, '')}]: ${message}`,
                    `Discord`
                );
            }
    
            // ? custom message format (config.discord.other.messageFormat)
            if (config.bot.other.messageMode === 'minecraft' && chat !== 'debugChannel') {
                message = replaceVariables(config.discord.other.messageFormat, {
                    chatType,
                    username,
                    rank,
                    guildRank,
                    message
                });
            }
    
            const channel = await this.stateHandler.getChannel(chat || 'Guild');
            if (channel === undefined) {
                return;
            }
    
            if (chat == 'Officer') {
                if(bot.username != username){
                    channel
                        .send({
                            content: `[OFFICER]|@|${username}|@|${message}`
                        })
                        .then(
                            (message_officer) => {
                                message_officer.delete();
                            },
                            () => {}
                        );
                }
            }
    
            switch (mode) {
                case 'bot':
                    await channel.send({
                        embeds: [
                            {
                                description: message,
                                color: this.hexToDec(color),
                                timestamp: new Date(),
                                footer: {
                                    text: guildRank
                                },
                                author: {
                                    name: username,
                                    icon_url: `https://www.mc-heads.net/avatar/${username}`
                                }
                            }
                        ]
                    });

                    break;
    
                case 'webhook':
                    message = this.cleanMessage(message);
                    if (message.length === 0) {
                        return;
                    }
    
                    this.app.discord.webhook = await this.getWebhook(this.app.discord, chatType);
                    this.app.discord.webhook.send({
                        content: message,
                        username: username,
                        avatarURL: `https://www.mc-heads.net/avatar/${username}`
                    });
                    break;
    
                case 'minecraft':
                    if (fullMessage.length === 0) {
                        return;
                    }
    
                    await channel.send({
                        files: [
                            new AttachmentBuilder(await messageToImage(message, username), {
                                name: `${username}.png`
                            })
                        ]
                    });
    
                    break;
    
                default:
                    throw new Error('Invalid message mode: must be bot, webhook or minecraft');
            }
        }
        catch(e){
            Logger.warnMessage(e);
        }
    }

    cleanMessage(message) {
        if (message === undefined) {
            return '';
        }

        return message
            .split('\n')
            .map((part) => {
                part = part.trim();
                return part.length === 0 ? '' : part.replace(/@(everyone|here)/gi, '').trim() + ' ';
            })
            .join('');
    }

    formatMessage(message, data) {
        return replaceVariables(message, data);
    }
}

module.exports = DiscordManager;
