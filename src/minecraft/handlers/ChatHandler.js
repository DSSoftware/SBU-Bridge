const { replaceAllRanks, replaceVariables } = require('../../contracts/helperFunctions.js');
const { getLatestProfile } = require('../../../API/functions/getLatestProfile.js');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const messages = require('../../../messages.json');
const { EmbedBuilder } = require('discord.js');
const config = require('#root/config.js').getConfig();
const getDungeons = require('../../../API/stats/dungeons.js');
const sbuHelper = require('../../api/sbuHelper.js');

class StateHandler extends eventHandler {
    async onMessage(event) {
        const message = event.toString();
        const colouredMessage = event.toMotd();

        if(event?.clickEvent?.value !== undefined){
            console.log(event?.clickEvent?.value);
        }

        if (this.isRequestMessage(message)) {
            let username = replaceAllRanks(
                message.split('has')[0].replaceAll('-----------------------------------------------------\n', '')
            );
            try {
                username = username.trim();
            } catch (e) {
                bot.chat(`/oc Somehow bot failed trim the player's IGN. Accept the invite manually!`);
                return;
            }

            let uuid;
            try {
                uuid = await getUUID(username);
                if (uuid == undefined) {
                    throw 'Failed to obtain UUID';
                }
            } catch (e) {
                bot.chat(`/oc Could not obtain UUID for ${username}. Please check manually!`);
                return;
            }

            if (config.minecraft.guildRequirements.enabled) {
                // Checking the requirements
                let skyblockLevel = 0;
                let catacombsLevel = 0;
                let passed_requirements = true;
                let meetRequirements = false;

                const skykings_scammer = await Skykings.lookupUUID(uuid);
                const blacklisted = await Blacklist.checkBlacklist(uuid);
                const scf_blacklisted = await SCFAPI.checkBlacklist(uuid);

                try {
                    let profile = await getLatestProfile(uuid);

                    for(let unique_profile of profile.profiles){
                        let unique_player = unique_profile.members[uuid];

                        skyblockLevel = Math.max((unique_player?.leveling?.experience || 0) / 100 ?? 0, skyblockLevel);
                        const dungeonsStats = getDungeons(unique_player, undefined);
                        catacombsLevel = Math.max(Math.round(dungeonsStats?.catacombs?.skill?.levelWithProgress || 0), catacombsLevel);
                    }

                    // MAIN REQS
                    if (skyblockLevel < config.minecraft.guildRequirements.requirements.skyblockLevel) {
                        passed_requirements = false;
                    }
                    if (catacombsLevel < config.minecraft.guildRequirements.requirements.catacombsLevel) {
                        passed_requirements = false;
                    }
                    // MAIN REQS

                } catch (e) {
                    bot.chat(`/oc Couldn't check ${username}'s stats. Please, check manually.`);
                    return;
                }
                //

                const statsEmbed = new EmbedBuilder()
                    .setColor(2067276)
                    .setTitle(`${username} has requested to join the Guild!`)
                    .setDescription(`Info:`)
                    .addFields(
                        {
                            name: 'Skyblock Level',
                            value: `\`${skyblockLevel.toLocaleString()}\``,
                            inline: true
                        },
                        {
                            name: 'Catacombs Level',
                            value: `\`${catacombsLevel.toLocaleString()}\``,
                            inline: true
                        },
                        {
                            name: 'Passed Skill Requirements',
                            value: passed_requirements ? ':white_check_mark:' : ':x:',
                            inline: true
                        },
                        {
                            name: 'Skykings Flag',
                            value: `\`${skykings_scammer}\``,
                            inline: true
                        },
                        {
                            name: 'Blacklist Flag',
                            value: `\`${blacklisted}\``,
                            inline: true
                        },
                        {
                            name: 'SCF Flag',
                            value: `\`${scf_blacklisted}\``,
                            inline: true
                        }
                    )
                    .setThumbnail(`https://www.mc-heads.net/avatar/${username}`)
                    .setFooter({
                        text: `/help [command] for more information`,
                        iconURL: config.branding.logo
                    });

                await client.channels.cache
                    .get(`${config.discord.channels.loggingChannel}`)
                    .send({ embeds: [statsEmbed] });

                if (
                    passed_requirements &&
                    skykings_scammer !== true &&
                    blacklisted !== true &&
                    scf_blacklisted !== true
                ) {
                    meetRequirements = true;
                } else {
                    if (skykings_scammer || blacklisted || scf_blacklisted) {
                        try {
                            bot.chat(
                                `/oc ${username} was banned from the guild by admin, therefore will not be accepted. Please, do not accept this request or you may get demoted.`
                            );

                            this.minecraft.broadcastHeadedEmbed({
                                message: 'Banned player (' + username + ') tried to join the guild.',
                                title: `Banned player`,
                                icon: `https://mc-heads.net/avatar/${username}`,
                                color: 15548997,
                                channel: 'Logger'
                            });
                            
                            return;
                        } catch (e) {
                            bot.chat(`/oc Something went wrong while trying to kick a banned player...`);
                            return;
                        }
                    }
                }

                bot.chat(
                    `/oc ${username} ${
                        meetRequirements ? 'meets' : "Doesn't meet"
                    } Requirements. SB Level: ${skyblockLevel.toLocaleString()} | Cata Level: ${catacombsLevel.toLocaleString()} | Scammer: ${skykings_scammer.toLocaleString()} | Blacklist: ${blacklisted.toLocaleString()}`
                );
                await delay(1000);

                if (meetRequirements === true) {
                    if (config.minecraft.guildRequirements.enabled === true) {
                        bot.chat(`/guild accept ${username}`);
                    }
                }
            }
        }

        if (this.isJoinMessage(message)) {

                bot.chat(`/guild kick ${username} You were banned from this guild. Submit an appeal to rejoin.`);

            let invite_message = config.minecraft.guild.join_message
                ? config.minecraft.guild.join_message
                : messages.guildJoinMessage;

            try {
                // Check if SBU service is available before making calls
                if (config.API.SBU.enabled) {
                    console.log('Making SBU API call with data:', {
                        uuid: uuid,
                        guildId: config.minecraft.guild.guildId,
                        endpoint: `/api/hypixel/player/${uuid}/upsert`
                    });

                    // This will either execute immediately if service is ready,
                    // or queue the call until service is initialized
                    const response = await sbuHelper.safeApiCall(`/api/hypixel/player/${uuid}/upsert`, {
                        method: 'POST',
                        data: {
                            uuid: uuid,
                            guildId: config.minecraft.guild.guildId
                        }
                    });
                    
                    if (response) {
                        console.log('SBU API call successful:');

                        // Add delay before member deletion
                        await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay

                        // Make API call to verify user
                        console.log('Making SBU verify-user API call');
                        const verifyResponse = await sbuHelper.safeApiCall(`/api/discord/verify-user`, {
                            method: 'POST',
                            data: {
                                uuid: uuid
                            }
                        });
                        
                        if (verifyResponse) {
                            console.log('SBU verify-user API call successful:');
                        }
                        
                        // Make second API call to send embedded message
                        console.log('Making SBU send-embed API call');
                        const embedResponse = await sbuHelper.safeApiCall(`/api/discord/send-embed`, {
                            method: 'POST',
                            data: {
                                channelId: config.API.SBU.logchan,
                                embed: {
                                    title: "Guild Member Joined",
                                    description: `${username} has joined the guild and been added to SBU tracking`,
                                    color: 2067276,
                                    fields: [
                                        {
                                            name: "Player",
                                            value: username,
                                            inline: true
                                        },
                                        {
                                            name: "UUID",
                                            value: uuid,
                                            inline: true
                                        },
                                        {
                                            name: "Status",
                                            value: "Successfully tracked",
                                            inline: true
                                        }
                                    ]
                                },
                                userId: uuid
                            }
                        });
                        
                        if (embedResponse) {
                            console.log('SBU send-embed API call successful:');
                        }
                    }
                } else {
                    console.log('SBU Service not enabled, skipping SBU API calls');
                }
            } catch (error) {
                console.log('SBU API call failed:', {
                    message: error.message,
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                    config: {
                        url: error.config?.url,
                        method: error.config?.method,
                        data: error.config?.data
                    }
                });
                // Continue execution even if SBU calls fail - don't throw the error
                console.log('Continuing without SBU integration due to service unavailability');
            }
            return [
                this.minecraft.broadcastHeadedEmbed({
                    message: replaceVariables(messages.joinMessage, { username }),
                    title: `Member Joined`,
                    icon: `https://mc-heads.net/avatar/${username}`,
                    color: 2067276,
                    channel: 'Logger'
                }),
                this.minecraft.broadcastHeadedEmbed({
                    message: replaceVariables(messages.joinMessage, { username }),
                    title: `Member Joined`,
                    icon: `https://mc-heads.net/avatar/${username}`,
                    color: 2067276,
                    channel: 'Guild'
                })
            ];
        }

        if (this.isLeaveMessage(message)) {
            const username = message
                .replace(/\[(.*?)\]/g, '')
                .trim()
                .split(/ +/g)[0];

            try {
                // Get UUID for the user who left
                let uuid;
                try {
                    uuid = await getUUID(username);
                } catch (e) {
                    console.log('Failed to get UUID for user:', username);
                }

                // Check if SBU service is available before making calls
                if (config.API.SBU.enabled && uuid) {
                    // Make API call to deverify user first
                    console.log('Making SBU deverify-user API call');
                    const deverifyResponse = await sbuHelper.safeApiCall(`/api/discord/deverify-user`, {
                        method: 'POST',
                        data: {
                            uuid: uuid
                        }
                    });
                    
                    if (deverifyResponse) {
                        console.log('SBU deverify-user API call successful:');
                    }

                    // Add delay before member deletion
                    await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay

                    console.log('Making SBU API call with data:', {
                        endpoint: `/api/members/${uuid}/guild/${config.minecraft.guild.guildId}`
                    });

                    // This will either execute immediately if service is ready,
                    // or queue the call until service is initialized
                    const response = await sbuHelper.safeApiCall(`/api/members/${uuid}/guild/${config.minecraft.guild.guildId}`, {
                        method: 'DELETE',
                        data: {
                            uuid: uuid,
                            guildId: config.minecraft.guild.guildId
                        }
                    });

                    if (response) {
                        console.log('SBU API call successful:');

                        // Make second API call to send embedded message
                        console.log('Making SBU send-embed API call');
                        const embedResponse = await sbuHelper.safeApiCall(`/api/discord/send-embed`, {
                            method: 'POST',
                            data: {
                                channelId: config.API.SBU.logchan,
                                embed: {
                                    title: "Guild Member Left",
                                    description: `${username} has left the guild and been removed from SBU tracking`,
                                    color: 0xfc1303,
                                    fields: [
                                        {
                                            name: "Player",
                                            value: username,
                                            inline: true
                                        },
                                        {
                                            name: "UUID",
                                            value: uuid,
                                            inline: true
                                        },
                                        {
                                            name: "Status",
                                            value: "Successfully removed",
                                            inline: true
                                        }
                                    ]
                                },
                                userId: uuid
                            }
                        });

                        if (embedResponse) {
                            console.log('SBU send-embed API call successful:');
                        }
                    }
                } else {
                    console.log('SBU Service not enabled, skipping SBU API calls');
                }
            } catch (error) {
                console.log('SBU API call failed:', {
                    message: error.message,
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                    config: {
                        url: error.config?.url,
                        method: error.config?.method,
                        data: error.config?.data
                    }
                });
                // Continue execution even if SBU calls fail - don't throw the error
                console.log('Continuing without SBU integration due to service unavailability');
            }
        }

        if (this.isMuted(message)) {
            process.exit(123);
        }

        const regex =
            config.bot.other.messageMode === 'minecraft'
                ? /^(?<chatType>§[0-9a-fA-F](Guild|Officer)) > (?<rank>§[0-9a-fA-F](?:\[.*?\])?)?\s*(?<username>[^§\s]+)\s*(?:(?<guildRank>§[0-9a-fA-F](?:\[.*?\])?))?\s*§f: (?<message>.*)/
                : /^(?<chatType>\w+) > (?:(?:\[(?<rank>[^\]]+)\] )?(?:(?<username>\w+)(?: \[(?<guildRank>[^\]]+)\])?: )?)?(?<message>.+)$/;

        const match = (config.bot.other.messageMode === 'minecraft' ? colouredMessage : message).match(regex);

        if (!match) {
            return;
        }

        let command_channel = 'gc';
        if (match.groups.chatType == 'Officer') {
            command_channel = 'oc';
        }

        if (this.isCommand(match.groups.message)) {
            if (this.isDiscordMessage(match.groups.message) === true) {
                const { player, command } = this.getCommandData(match.groups.message);

                this.command.handle(player, command, command_channel);
            }

            this.command.handle(match.groups.username, match.groups.message, command_channel);
        }

        this.saveGuildMessage(match.groups.username, config.minecraft.guild.guildId, message);

        if ((this.isDiscordMessage(match.groups.message) && match.groups.username === this.bot.username) === false) {
            const { chatType, rank, username, guildRank = 'Member', message } = match.groups;

            if (message.includes('replying to') && match.groups.username === this.bot.username) {
                return;
            }

            this.minecraft.broadcastMessage({
                fullMessage: colouredMessage,
                chat: chatType,
                chatType,
                username,
                rank,
                guildRank,
                message,
                color: this.minecraftChatColorToHex(this.getRankColor(colouredMessage))
            });
        }
    }

    async saveGuildMessage(nick, guild, message = undefined) {
        if (nick == undefined) {
            return;
        }
        let uuid;
        try {
            uuid = await getUUID(nick);
        } catch (e) {
            return;
        }

        SCFAPI.saveMessage('minecraft', nick, uuid, guild);
    }

    isDiscordMessage(message) {
        const isDiscordMessage = /^(?<username>(?!https?:\/\/)[^\s»:>]+)\s*[»:>]\s*(?<message>.*)/;

        return isDiscordMessage.test(message);
    }

    isCommand(message) {
        const regex = new RegExp(
            `^(?<prefix>[${config.minecraft.bot.prefix}-])(?<command>\\S+)(?:\\s+(?<args>.+))?\\s*$`
        );

        if (regex.test(message) === false) {
            const getMessage = /^(?<username>(?!https?:\/\/)[^\s»:>\s]+)\s*[»:>\s]\s*(?<message>.*)/;

            const match = message.match(getMessage);
            if (match === null || match.groups.message === undefined) {
                return false;
            }

            return regex.test(match.groups.message);
        }

        return regex.test(message);
    }

    getCommandData(message) {
        const regex = /^(?<player>[^\s»:>\s]+(?:\s+[^\s»:>\s]+)*)\s*[»:>\s]\s*(?<command>.*)/;

        const match = message.match(regex);
        if (match === null) {
            return {};
        }

        return match.groups;
    }

    getRankColor(message) {
        const regex = /§\w*\[(\w*[a-zA-Z0-9]+§?\w*(?:\+{0,2})?§?\w*)\] /g;

        const match = message.match(regex);
        if (match) {
            const color = match[0]
                .match(/§(\w)/g)
                .filter((value, index, self) => self.indexOf(value) === index)
                .at(-1);

            return color.slice(1);
        }

        return '7';
    }

    isMessageFromBot(username) {
        return bot.username === username;
    }

    isGuildMessage(message) {
        return message.startsWith('Guild >') && message.includes(':');
    }

    isOfficerMessage(message) {
        return message.startsWith('Officer >') && message.includes(':');
    }

    isMuted(message) {
        return message.includes('Your mute will expire in') && !message.includes(':');
    }

    minecraftChatColorToHex(color) {
        switch (color) {
            case '0':
                return '#000000';
            case '1':
                return '#0000AA';
            case '2':
                return '#00AA00';
            case '3':
                return '#00AAAA';
            case '4':
                return '#AA0000';
            case '5':
                return '#AA00AA';
            case '6':
                return '#FFAA00';
            case '7':
                return '#AAAAAA';
            case '8':
                return '#555555';
            case '9':
                return '#5555FF';
            case 'a':
                return '#55FF55';
            case 'b':
                return '#55FFFF';
            case 'c':
                return '#FF5555';
            case 'd':
                return '#FF55FF';
            case 'e':
                return '#FFFF55';
            case 'f':
                return '#FFFFFF';
            default:
                return '#FFFFFF';
        }
    }
}

module.exports = StateHandler;