const { uploadImage } = require('../../contracts/API/imgurAPI.js');
const { demojify } = require('discord-emoji-converter');
const config = require('#root/config.js').getConfig();
const axios = require('axios');
const scfBridgeLock = require('../../../API/utils/scfBridgeLock.js');
const SCFAPI = require('../../../API/utils/scfAPIHandler.js');
const playerAPI = require('../../contracts/API/PlayerDBAPI.js');
const Logger = require('#root/src/Logger.js');
const { hypixelRequest } = require('../../../API/utils/scfAPIHandler.js');
const sbuHelper = require('../../api/sbuHelper.js');

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
            let uuid = await SCFAPI.getLinked(discord_id).catch(() => {
                throw {
                    name: 'Failed to obtain API Data.',
                    doNotHandle: true
                };
            });

            if (!uuid) {
                return response;
            }

            let hypixel_info = await hypixelRequest(`https://api.hypixel.net/v2/player?key=${config.API.hypixelAPIkey}&uuid=${uuid}`)
                .catch((error) => {
                    return {};
                });

            if (!hypixel_info?.success || hypixel_info?.player?.displayname == undefined) {
                return response;
            }

            response.uuid = uuid;
            response.nick = await playerAPI.getUsername(uuid);

            let guild_info = await hypixelRequest(`https://api.hypixel.net/v2/guild?key=${config.API.hypixelAPIkey}&player=${uuid}`)
                .catch((error) => {
                    return {};
                });

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

            // Handle usual messages sent via normal chat.

            let sender_data = undefined;

            // Check if user has required bridge roles
            if (!message.author.bot && config.API?.SBU) {
                const userRoles = message.member.roles.cache.map(role => role.id);
                const hasBridgeRole = config.API.SBU.bridge_role && userRoles.includes(config.API.SBU.bridge_role);
                const hasBridgePlusRole = config.API.SBU.bridgeplus_role && userRoles.includes(config.API.SBU.bridgeplus_role);
                const hasBlacklistRole = config.API.SBU.bridge_blacklist_role && userRoles.includes(config.API.SBU.bridge_blacklist_role);
                const hasBridgeExternalRole = config.API.SBU.bridge_external_role && userRoles.includes(config.API.SBU.bridge_external_role);


                // If user has blacklist role (declined), deny access
                if (hasBlacklistRole) {
                    message.react('❌').catch((e) => {});
                    return;
                }

                // If approval system is enabled, check for bridge roles and handle approval process
                if (config.API.SBU.require_approval) {
                    // If user doesn't have bridge or bridgeplus role
                    if (!hasBridgeRole && !hasBridgePlusRole && !hasBridgeExternalRole) {
                        // Check if user is blacklisted first
                        const isBlacklisted = await this.checkIfUserBlacklisted(message.author.id);
                        if (isBlacklisted) {
                            message.react('❌').catch((e) => {});
                            return;
                        }

                        // Check current approval status from API and cache
                        const approvalKey = `approval_${message.author.id}`;
                        let approvalData = sender_cache.get(approvalKey);

                        // If no cached data or cache is old, check API status
                        if (!approvalData || (Date.now() - approvalData.last_save) > 300000) { // 5 minutes cache
                            try {
                                console.log(`Checking approval status for user ${message.author.username} (${message.author.id})`);
                                const apiStatus = await this.checkApprovalStatus(message.author.id);
                                console.log(`Approval status result: ${apiStatus}`);
                                
                                approvalData = {
                                    last_save: Date.now(),
                                    status: apiStatus
                                };
                                sender_cache.set(approvalKey, approvalData);
                            } catch (error) {
                                console.log('Error checking approval status:', error);
                                // If API check fails and no cached data, treat as new user
                                if (!approvalData) {
                                    approvalData = { status: 'new' };
                                }
                            }
                        }

                        console.log(`Final approval status for ${message.author.username}: ${approvalData.status}`);

                        // Handle different approval statuses
                        if (approvalData.status === 'pending') {
                            console.log(`User ${message.author.username} has pending approval - reacting with ⏳`);
                            message.react('⏳').catch((e) => {});
                            return;
                        } else if (approvalData.status === 'denied') {
                            console.log(`User ${message.author.username} is denied - reacting with ❌`);
                            message.react('❌').catch((e) => {});
                            return;
                        } else if (approvalData.status === 'approved') {
                            console.log(`User ${message.author.username} is approved but doesn't have bridge role - allowing message`);
                            // User is approved but doesn't have the role yet - this shouldn't happen
                            // but we'll allow it and let Discord role sync handle it
                        } else {
                            // New user or unknown status - send approval request
                            console.log(`Sending new approval request for ${message.author.username}`);
                            try {
                                // Try to get existing UUID if user is already linked
                                let userUuid = null;
                                try {
                                    const existingSenderData = await this.getSenderData(message.author.id);
                                    userUuid = existingSenderData?.data?.uuid || null;
                                } catch (e) {
                                    // User not linked, UUID remains null
                                }

                                console.log('Making approval request API call with data:', {
                                    userId: message.author.id,
                                    username: message.author.username,
                                    uuid: userUuid,
                                    endpoint: '/api/discord/bridge'
                                });

                                const response = await sbuHelper.safeApiCall('/api/discord/bridge', {
                                    method: 'POST',
                                    data: {
                                        discordUserId: message.author.id,
                                        uuid: userUuid
                                    }
                                });

                                if (response) {
                                    console.log('Approval request API call successful for', message.author.username);

                                    // Cache the approval request to prevent duplicates
                                    sender_cache.set(approvalKey, {
                                        last_save: Date.now(),
                                        status: 'pending'
                                    });

                                    // Send reply to user
                                    message.reply({
                                        embeds: [
                                            {
                                                color: 16776960, // Yellow color
                                                title: '⏳ Approval Required',
                                                description: 'Your request to use the bridge has been sent for approval. Please wait for a moderator to review your request.',
                                                footer: {
                                                    text: 'You will be notified once your request is processed.'
                                                }
                                            }
                                        ]
                                    });

                                    message.react('⏳').catch((e) => {});
                                    return;
                                } else {
                                    console.log('Approval request API call returned no response for', message.author.username);
                                }
                            } catch (error) {
                                console.log('Approval request API call failed for', message.author.username, ':', {
                                    message: error.message,
                                    status: error.response?.status,
                                    statusText: error.response?.statusText,
                                    data: error.response?.data
                                });

                                message.reply({
                                    embeds: [
                                        {
                                            color: 15548997, // Red color
                                            title: '❌ Error',
                                            description: 'Failed to send approval request. Please try again later or contact an administrator.'
                                        }
                                    ]
                                });

                                message.react('❌').catch((e) => {});
                                return;
                            }
                        }
                    }
                }
                // If approval system is disabled, only check for blacklist role
                // Users without bridge roles are allowed to send messages (as long as they don't have blacklist role)
                // The blacklist role check is already done above, so we don't need to do anything else here
            }

            if (config.API.SCF.enabled) {
                let bypassCheck = false;
                try {
                    sender_data = await this.getSenderData(message.author.id);
                } catch (e) {
                    if (!(config.bot.other.discordFallback || message.author.bot)) {
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

            if (config.bot.other.messageMode === 'bot' && reference.embed !== null) {
                const name = reference.embeds[0]?.author?.name;
                if (name === undefined) {
                    return mentionedUserName;
                }

                return name;
            }

            if (config.bot.other.messageMode === 'minecraft' && reference.attachments !== null) {
                const name = reference.attachments.values()?.next()?.value?.name;
                if (name === undefined) {
                    return mentionedUserName;
                }

                return name.split('.')[0];
            }

            if (config.bot.other.messageMode === 'webhook') {
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
            //config.discord.IGC.settings.listening
        ];

        return isValid && validChannelIds.includes(message.channel.id);
    }

    async checkIfUserBlacklisted(userId) {
        // Implement your logic to check if a user is blacklisted
        // For example, you might want to query a database or another service
        // Here is a placeholder implementation:
        const blacklist = ['123456789012345678']; // Example blacklist array
        return blacklist.includes(userId);
    }

    updateApprovalStatus(userId, status) {
        const approvalKey = `approval_${userId}`;
        sender_cache.set(approvalKey, {
            last_save: Date.now(),
            status: status // 'approved', 'denied', or 'pending'
        });
    }

    async checkApprovalStatus(userId) {
        try {
            // Get the user from the guild to check their current roles
            const guildId = config.discord.guildId || config.discord.serverID;
            if (!guildId) {
                throw new Error('Guild ID not configured');
            }

            const guild = this.discord.client.guilds.cache.get(guildId);
            if (!guild) {
                throw new Error(`Guild not found with ID: ${guildId}`);
            }

            const member = await guild.members.fetch(userId);
            if (!member) {
                throw new Error('Member not found');
            }

            const userRoles = member.roles.cache.map(role => role.id);
            const hasBridgeRole = config.API.SBU.bridge_role && userRoles.includes(config.API.SBU.bridge_role);
            const hasBridgePlusRole = config.API.SBU.bridgeplus_role && userRoles.includes(config.API.SBU.bridgeplus_role);
            const hasDeniedRole = config.API.SBU.denied_role && userRoles.includes(config.API.SBU.denied_role);
            const hasBridgeExternalRole = config.API.SBU.bridge_external_role && userRoles.includes(config.API.SBU.bridge_external_role);

            console.log(`Checking approval status for ${member.user.username}:`, {
                hasBridgeRole,
                hasBridgePlusRole,
                hasDeniedRole,
                userRoles: userRoles.length
            });

            // If user has bridge roles, they are approved
            if (hasBridgeRole || hasBridgePlusRole || hasBridgeExternalRole) {
                return 'approved';
            }

            // If user has denied role, they are denied
            if (hasDeniedRole) {
                return 'denied';
            }

            // Check cache for existing approval status
            const approvalKey = `approval_${userId}`;
            const cachedData = sender_cache.get(approvalKey);

            console.log(`Cache data for ${member.user.username}:`, cachedData);

            // If user has no bridge roles and no denied role, but has cached approval status,
            // this means their roles were removed - clear cache and treat as new
            if (cachedData && (cachedData.status === 'approved' || cachedData.status === 'pending')) {
                console.log(`User ${member.user.username} has cached status ${cachedData.status} but no bridge roles - clearing cache and treating as new`);
                sender_cache.delete(approvalKey);
                return 'new';
            }

            // If cached data exists and it's recent, use it (for denied status only at this point)
            if (cachedData && cachedData.status === 'denied' && (Date.now() - cachedData.last_save) < 300000) { // 5 minutes
                console.log(`Using cached denied status for ${member.user.username}: ${cachedData.status}`);
                return cachedData.status;
            }

            // Default to new user if no cache or old cache
            console.log(`Treating ${member.user.username} as new user`);
            return 'new';
        } catch (error) {
            console.log('Failed to check approval status:', error.message);
            return 'new';
        }
    }

    handleRoleUpdate(oldMember, newMember) {
        // Only handle role updates if approval system is enabled
        if (!config.API?.SBU?.require_approval) {
            return;
        }

        // Check if bridge-related roles were added or removed
        const oldRoles = oldMember.roles.cache.map(role => role.id);
        const newRoles = newMember.roles.cache.map(role => role.id);

        const bridgeRoles = [config.API.SBU.bridge_role, config.API.SBU.bridgeplus_role, config.API.SBU.bridge_external_role].filter(Boolean);
        const deniedRole = config.API.SBU.denied_role;

        const hadBridgeRole = bridgeRoles.some(roleId => oldRoles.includes(roleId));
        const hasBridgeRole = bridgeRoles.some(roleId => newRoles.includes(roleId));
        const hadDeniedRole = deniedRole && oldRoles.includes(deniedRole);
        const hasDeniedRole = deniedRole && newRoles.includes(deniedRole);

        const approvalKey = `approval_${newMember.id}`;

        // If bridge roles changed, update the approval cache
        if (hadBridgeRole !== hasBridgeRole) {
            if (hasBridgeRole) {
                // User was approved (bridge role added)
                sender_cache.set(approvalKey, {
                    last_save: Date.now(),
                    status: 'approved'
                });

                // Optionally notify the user they were approved
                newMember.send({
                    embeds: [{
                        color: 5763719, // Green color
                        title: '✅ Bridge Access Approved',
                        description: 'Your request to use the bridge has been approved! You can now send messages through the bridge.'
                    }]
                }).catch(() => {}); // Ignore if DMs are disabled

            } else if (hadBridgeRole && !hasBridgeRole) {
                // Bridge role was removed - reset status and potentially resend approval request
                sender_cache.delete(approvalKey); // Clear the cache
                
                // Notify user that their access was revoked
                newMember.send({
                    embeds: [{
                        color: 16776960, // Yellow color
                        title: '⚠️ Bridge Access Revoked',
                        description: 'Your bridge access has been revoked. If you believe this is an error, please try sending a message in the bridge channel to request approval again.'
                    }]
                }).catch(() => {}); // Ignore if DMs are disabled

                console.log(`Bridge access revoked for user ${newMember.user.username} (${newMember.id})`);
            }
        }

        // Handle denied role changes
        if (hadDeniedRole !== hasDeniedRole) {
            if (hasDeniedRole) {
                // User was denied (denied role added)
                sender_cache.set(approvalKey, {
                    last_save: Date.now(),
                    status: 'denied'
                });

                // Optionally notify the user they were denied
                newMember.send({
                    embeds: [{
                        color: 15548997, // Red color
                        title: '❌ Bridge Access Denied',
                        description: 'Your request to use the bridge has been denied. Please contact a moderator if you believe this is an error.'
                    }]
                }).catch(() => {}); // Ignore if DMs are disabled

            } else if (hadDeniedRole && !hasDeniedRole) {
                // Denied role was removed - clear the cache so they can request again
                sender_cache.delete(approvalKey);
                
                console.log(`Denied status cleared for user ${newMember.user.username} (${newMember.id})`);
            }
        }
    }
}

module.exports = MessageHandler;