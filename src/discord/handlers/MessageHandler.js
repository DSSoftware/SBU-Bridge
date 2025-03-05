const { uploadImage } = require('../../contracts/API/imgurAPI.js');
const { demojify } = require('discord-emoji-converter');
const config = require('../../../config.js');
const axios = require('axios');
const scfBridgeLock = require('../../../API/utils/scfBridgeLock.js');
const SCFAPI = require('../../../API/utils/scfAPIHandler.js');
const playerAPI = require('../../contracts/API/PlayerDBAPI.js');
const Logger = require('#root/src/Logger.js');

const sender_cache = new Map();

class MessageHandler {
    constructor(discord, command) {
        this.discord = discord;
        this.command = command;
    }

    async cacheSender(discord_id) {
        let response = {
            uuid: undefined,
            guild_id: undefined,
            nick: undefined
        };
        try {
            let player_info = await SCFAPI.getLinked(discord_id).catch(() => {
                throw {
                    name: 'Failed to obtain API Data.',
                    doNotHandle: true
                };
            });

            if (!player_info?.data?.exists) {
                return response;
            }

            let uuid = player_info?.data?.uuid;

            let hypixel_info = await Promise.all([
                axios.get(`https://api.hypixel.net/player?key=${config.minecraft.API.hypixelAPIkey}&uuid=${uuid}`)
            ]).catch((error) => {});

            hypixel_info = hypixel_info?.[0]?.data ?? {};

            if (!hypixel_info?.success || hypixel_info?.player?.displayname == undefined) {
                return response;
            }

            response.uuid = player_info?.data?.uuid;
            response.nick = await playerAPI.getUsername(player_info?.data?.uuid);

            let guild_info = await Promise.all([
                axios.get(`https://api.hypixel.net/guild?key=${config.minecraft.API.hypixelAPIkey}&player=${uuid}`)
            ]).catch((error) => {});

            guild_info = guild_info?.[0]?.data ?? {};

            response.guild_id = guild_info?.guild?._id;

            sender_cache.set(discord_id, {
                last_save: Date.now(),
                data: response
            });

            return {
                last_save: Date.now(),
                data: response
            };
        } catch (e) {
            if (e?.doNotHandle == true) {
                throw e;
            }
            Logger.warnMessage(e);
        }
    }

    async getSenderData(discord_id) {
        if (sender_cache.has(discord_id)) {
            const data = sender_cache.get(discord_id);

            if (data.last_save + 600000 > Date.now()) {
                return data;
            }
        }

        let data = await this.cacheSender(discord_id);
        return data;
    }

    async onMessage(message) {
        try {
            if (message.author.id === client.user.id || !this.shouldBroadcastMessage(message)) {
                return;
            }

            // Handle specific cases IGC message sender.
            if (config.discord.IGC.enabled && config.discord.IGC.settings.listening == message.channel.id) {
                if (message.webhookId !== null) {
                    if(message.author.id == config.discord.IGC.settings.webhook_self){
                        return;
                    }
                    console.log(message);
                }
                return;
            }

            // Handle usual messages sent via normal chat.

            let sender_data = undefined;

            if (config.minecraft.API.SCF.enabled) {
                let bypassCheck = false;
                try {
                    sender_data = await this.getSenderData(message.author.id);
                } catch (e) {
                    if (!(config.discord.other.discordFallback || message.author.bot)) {
                        message.reply({
                            embeds: [
                                {
                                    color: 15548997,
                                    description:
                                        'Failed to obtain your link status. This may happen due to API being down. Please let admins know.'
                                }
                            ]
                        });
                        return;
                    }
                    bypassCheck = true;
                }

                if (!bypassCheck) {
                    if (sender_data?.data?.nick == undefined && !message.author.bot) {
                        if (message.channel.id == config.discord.channels.officerChannel) {
                            message.react('❌').catch((e) => {});
                            return;
                        }
                        message.reply({
                            embeds: [
                                {
                                    color: 15548997,
                                    description:
                                        'In order to use bridge, please use `' +
                                        `/${config.minecraft.bot.guild_prefix}` +
                                        'link' +
                                        '` command.\nThis way the messages will be sent with your Minecraft IGN.\nKeep in mind, your messages will **NOT** be sent otherwise.'
                                }
                            ]
                        });
                        return;
                    }

                    const isBridgeLocked = await scfBridgeLock.checkBridgelock(sender_data?.data?.uuid);
                    if (isBridgeLocked) {
                        message.react('❌').catch((e) => {});
                        return;
                    }
                }
            }

            let real_username = sender_data?.data?.nick ?? message.member.displayName ?? message.author.username;

            let content = this.stripDiscordContent(message).trim();
            if (content.length === 0 && message?.attachments?.size == 0) {
                return;
            }

            let chat = 'Guild/InterDiscord';
            if (message.channel.id == config.discord.channels.debugChannel) {
                chat = 'Debug';
            }

            if (message.channel.id == config.discord.channels.officerChannel) {
                chat = 'Officer/InterDiscord';
            }

            if (chat == 'Officer/InterDiscord' && message.author.bot) {
                let parts = content.split('|@|');
                let identifier = parts.shift();
                if (identifier == '[OFFICER]') {
                    let player_nick = parts.shift();
                    let message = parts.join(' ');

                    content = message;
                    real_username = player_nick;
                }
            }

            this.saveGuildMessage(real_username, sender_data?.data?.uuid, sender_data?.data?.guild_id ?? '');

            const messageData = {
                chat: chat,
                member: message.member.user,
                channel: message.channel.id,
                username: real_username,
                message: content,
                replyingTo: await this.fetchReply(message),
                discord: message
            };

            const images = content.split(' ').filter((line) => line.startsWith('http'));
            for (const attachment of message.attachments.values()) {
                images.push(attachment.url);
            }

            if (images.length > 0) {
                for (const attachment of images) {
                    if (!config.minecraft.commands.integrate_images) {
                        break;
                    }
                    const imgurLink = await uploadImage(attachment);

                    messageData.message = messageData.message.replace(attachment, imgurLink.data.link);

                    if (messageData.message.includes(imgurLink.data.link) === false) {
                        messageData.message += ` ${imgurLink.data.link}`;
                    }
                }
            }

            if (messageData.message.length === 0) {
                return;
            }

            this.discord.broadcastMessage(messageData);
        } catch (error) {
            Logger.warnMessage(error);
        }
    }

    async saveGuildMessage(nick, uuid, guild) {
        SCFAPI.saveMessage('discord', nick, uuid, guild);
    }

    async fetchReply(message) {
        try {
            if (message.reference?.messageId === undefined || message.mentions === undefined) {
                return null;
            }

            const reference = await message.channel.messages.fetch(message.reference.messageId);

            let mentionedUserName = message.mentions.repliedUser.username;
            let mentionedUserID = message?.mentions?.repliedUser?.id;
            if (mentionedUserID != undefined) {
                let repliedUserObject = await message.guild.members.cache.get(mentionedUserID);
                let sender_data = undefined;
                try {
                    sender_data = await this.getSenderData(mentionedUserID);
                } catch (e) {
                    // Do nothing.
                }
                mentionedUserName = sender_data?.data?.nick ?? repliedUserObject?.user?.username;
            }

            if (config.discord.other.messageMode === 'bot' && reference.embed !== null) {
                const name = reference.embeds[0]?.author?.name;
                if (name === undefined) {
                    return mentionedUserName;
                }

                return name;
            }

            if (config.discord.other.messageMode === 'minecraft' && reference.attachments !== null) {
                const name = reference.attachments.values()?.next()?.value?.name;
                if (name === undefined) {
                    return mentionedUserName;
                }

                return name.split('.')[0];
            }

            if (config.discord.other.messageMode === 'webhook') {
                if (reference.author.username === undefined) {
                    return mentionedUserName;
                }

                return reference.author.username;
            }

            return mentionedUserName ?? null;
        } catch (error) {
            Logger.warnMessage(error);
            return null;
        }
    }

    stripDiscordContent(message) {
        let output = message.content
            .split('\n')
            .map((part) => {
                part = part.trim();
                return part.length === 0 ? '' : part.replace(/@(everyone|here)/gi, '').trim() + ' ';
            })
            .join('');

        const hasMentions = /<@|<#|<:|<a:/.test(message);
        if (hasMentions) {
            // Replace <@486155512568741900> with @DuckySoLucky
            const userMentionPattern = /<@(\d+)>/g;
            const replaceUserMention = (match, mentionedUserId) => {
                const mentionedUser = message.guild.members.cache.get(mentionedUserId);

                return `@${mentionedUser.displayName}`;
            };
            output = output.replace(userMentionPattern, replaceUserMention);

            // Replace <#1072863636596465726> with #💬・guild-chat
            const channelMentionPattern = /<#(\d+)>/g;
            const replaceChannelMention = (match, mentionedChannelId) => {
                const mentionedChannel = message.guild.channels.cache.get(mentionedChannelId);

                return `#${mentionedChannel.name}`;
            };
            output = output.replace(channelMentionPattern, replaceChannelMention);

            // Replace <:KEKW:628249422253391902> with :KEKW: || Replace <a:KEKW:628249422253391902> with :KEKW:
            const emojiMentionPattern = /<a?:(\w+):\d+>/g;
            output = output.replace(emojiMentionPattern, ':$1:');
        }

        // Replace IP Adresses with [IP Address Removed]
        const IPAddressPattern = /(?:\d{1,3}\s*\s\s*){3}\d{1,3}/g;
        output = output.replaceAll(IPAddressPattern, '[Removed]');

        // ? demojify() function has a bug. It throws an error when it encounters channel with emoji in its name. Example: #💬・guild-chat
        try {
            return demojify(output);
        } catch (e) {
            return output;
        }
    }

    shouldBroadcastMessage(message) {
        const isBot =
            message.author.bot &&
            config.discord.channels.allowedBots.includes(message.author.id) === false &&
            message.webhookId === null
                ? true
                : false;
        const isValid = !isBot && (message.content.length > 0 || message?.attachments?.size > 0 || message?.embeds?.size > 0);
        const validChannelIds = [
            config.discord.channels.officerChannel,
            config.discord.channels.guildChatChannel,
            config.discord.channels.debugChannel,
            config.discord.IGC.settings.listening
        ];

        return isValid && validChannelIds.includes(message.channel.id);
    }
}

module.exports = MessageHandler;
