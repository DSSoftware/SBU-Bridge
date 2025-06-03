const { replaceAllRanks, replaceVariables } = require('../../contracts/helperFunctions.js');
const { getLatestProfile } = require('../../../API/functions/getLatestProfile.js');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const hypixel = require('../../contracts/API/HypixelRebornAPI.js');
const { getUUID } = require('../../contracts/API/PlayerDBAPI.js');
const eventHandler = require('../../contracts/EventHandler.js');
const getWeight = require('../../../API/stats/weight.js');
const messages = require('../../../messages.json');
const { EmbedBuilder } = require('discord.js');
const config = require('../../../config.js');
const Logger = require('../../Logger.js');
const axios = require('axios');
const Skykings = require('../../../API/utils/skykings');
const Blacklist = require('../../../API/utils/blacklist');
const SCFAPI = require('../../../API/utils/scfAPIHandler');
const getDungeons = require('../../../API/stats/dungeons.js');

const { getNetworth } = require('skyhelper-networth');
const getSkills = require('../../../API/stats/skills.js');
const getSlayer = require('../../../API/stats/slayer.js');

class StateHandler extends eventHandler {
    constructor(minecraft, command, discord) {
        super();
        this.minecraft = minecraft;
        this.discord = discord;
        this.command = command;
    }

    registerEvents(bot) {
        this.bot = bot;
        this.bot.on('message', (message) => this.onMessage(message));
    }

    async onMessage(event) {
        const message = event.toString();
        const colouredMessage = event.toMotd();

        if(event?.clickEvent?.value !== undefined){
            console.log(event?.clickEvent?.value);
        }

        // NOTE: fixes "100/100❤     100/100✎ Mana" spam in the debug channel
        if (message.includes('✎ Mana') && message.includes('❤') && message.includes('/')) {
            return;
        }

        if (config.discord.channels.debugMode === true) {
            this.minecraft.broadcastMessage({
                fullMessage: colouredMessage,
                message: message,
                chat: 'debugChannel'
            });
        }

        /*if (this.isDirectMessage(message) && config.discord.IGC.enabled === true) {
            let raw_message = replaceAllRanks(message);
            raw_message = raw_message.replace("From ", "");
            let raw_components = string.split(': ');
            const [igc_username, igc_message] = [raw_components.shift(), components.join(': ')];

            if(igc_message.startsWith("[IGC]")){
                igc_message = igc_message.replace("[IGC] ", "");

                let uuid = undefined;
                try {
                    uuid = await getUUID(igc_username);
                    if (uuid == undefined) {
                        throw 'Failed to obtain UUID';
                    }
                } catch (e) {
                    return;
                }

                if(uuid == undefined){
                    return;
                }

                SCFAPI.sendIGCMessage(uuid, igc_message);
            }
        }*/

        if (this.isLobbyJoinMessage(message) && config.discord.other.autoLimbo === true) {
            return bot.chat("/limbo");
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
                        iconURL: config.minecraft.API.SCF.logo
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

        if (this.isLoginMessage(message)) {
            if (config.discord.other.joinMessage === true) {
                const username = message.split('>')[1].trim().split('joined.')[0].trim();
                return this.minecraft.broadcastPlayerToggle({
                    fullMessage: colouredMessage,
                    username: username,
                    message: replaceVariables(messages.loginMessage, { username }),
                    color: 2067276,
                    channel: 'Guild'
                });
            }
        }

        if (this.isLogoutMessage(message)) {
            if (config.discord.other.joinMessage === true) {
                const username = message.split('>')[1].trim().split('left.')[0].trim();
                return this.minecraft.broadcastPlayerToggle({
                    fullMessage: colouredMessage,
                    username: username,
                    message: replaceVariables(messages.logoutMessage, { username }),
                    color: 15548997,
                    channel: 'Guild'
                });
            }
        }

        if (this.isJoinMessage(message)) {
            let username = message
                .replace(/\[(.*?)\]/g, '')
                .trim()
                .split(/ +/g)[0];
            try {
                username = username.trim();
            } catch (e) {
                Logger.warnMessage(e);
            }

            let uuid;
            try {
                uuid = await getUUID(username);
            } catch (e) {
                Logger.warnMessage(e);
            }

            const skykings_scammer = await Skykings.lookupUUID(uuid);
            const blacklisted = await Blacklist.checkBlacklist(uuid);
            const scf_blacklisted = await SCFAPI.checkBlacklist(uuid);

            const statsEmbed = new EmbedBuilder()
                .setColor(2067276)
                .setTitle(`${username} has joined the Guild!`)
                .addFields(
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
                    iconURL: config.minecraft.API.SCF.logo
                });

            await client.channels.cache.get(`${config.discord.channels.loggingChannel}`).send({ embeds: [statsEmbed] });

            if (skykings_scammer === true || blacklisted === true || scf_blacklisted === true) {
                this.minecraft.broadcastHeadedEmbed({
                    message: 'Banned player (' + username + ') tried to join the guild.',
                    title: `Banned player`,
                    icon: `https://mc-heads.net/avatar/${username}`,
                    color: 15548997,
                    channel: 'Logger'
                });

                bot.chat(`/guild kick ${username} You were banned from this guild. Submit an appeal to rejoin.`);

                return;
            }

            await delay(1000);
            let invite_message = config.minecraft.guild.join_message_override
                ? config.minecraft.guild.join_message
                : messages.guildJoinMessage;

            bot.chat(
                `/gc ${replaceVariables(invite_message, {
                    prefix: config.minecraft.bot.prefix
                })}`
            );

            if (process.env.notify_enabled === 'true') {
                await client.channels.cache
                    .get(`${config.discord.channels.loggingChannel}`)
                    .send(`${config.discord.commands.notifyContent}\n:inbox_tray: ${username} has joined the guild!`);
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

            if (process.env.notify_enabled === 'true') {
                await client.channels.cache
                    .get(`${config.discord.channels.loggingChannel}`)
                    .send(`${config.discord.commands.notifyContent}\n:outbox_tray: ${username} has left the guild!`);
            }

            let request_res = await SCFAPI.handleLeave(username);

            if(request_res){
                this.minecraft.broadcastHeadedEmbed({
                    message: 'Successfully unverified ' + username,
                    title: `Member Unverification`,
                    icon: `https://mc-heads.net/avatar/${username}`,
                    color: 15548997,
                    channel: 'Logger'
                });
            }
            else{
                this.minecraft.broadcastHeadedEmbed({
                    message: 'Failed to unverify ' + username,
                    title: `Member Unverification`,
                    icon: `https://mc-heads.net/avatar/${username}`,
                    color: 15548997,
                    channel: 'Logger'
                });
            }

            return [
                this.minecraft.broadcastHeadedEmbed({
                    message: replaceVariables(messages.leaveMessage, { username }),
                    title: `Member Left`,
                    icon: `https://mc-heads.net/avatar/${username}`,
                    color: 15548997,
                    channel: 'Logger'
                }),
                this.minecraft.broadcastHeadedEmbed({
                    message: replaceVariables(messages.leaveMessage, { username }),
                    title: `Member Left`,
                    icon: `https://mc-heads.net/avatar/${username}`,
                    color: 15548997,
                    channel: 'Guild'
                })
            ];
        }

        if (this.isKickMessage(message)) {
            const username = message
                .replace(/\[(.*?)\]/g, '')
                .trim()
                .split(/ +/g)[0];

            if (process.env.notify_enabled === 'true') {
                await client.channels.cache
                    .get(`${config.discord.channels.loggingChannel}`)
                    .send(`${config.discord.commands.notifyContent}\n:outbox_tray: ${username} has left the guild!`);
            }

            let request_res = await SCFAPI.handleLeave(username);

            if(request_res){
                this.minecraft.broadcastHeadedEmbed({
                    message: 'Successfully unverified ' + username,
                    title: `Member Unverification`,
                    icon: `https://mc-heads.net/avatar/${username}`,
                    color: 15548997,
                    channel: 'Logger'
                });
            }
            else{
                this.minecraft.broadcastHeadedEmbed({
                    message: 'Failed to unverify ' + username,
                    title: `Member Unverification`,
                    icon: `https://mc-heads.net/avatar/${username}`,
                    color: 15548997,
                    channel: 'Logger'
                });
            }

            return [
                this.minecraft.broadcastHeadedEmbed({
                    message: replaceVariables(messages.kickMessage, { username }),
                    title: `Member Kicked`,
                    icon: `https://mc-heads.net/avatar/${username}`,
                    color: 15548997,
                    channel: 'Logger'
                }),
                this.minecraft.broadcastHeadedEmbed({
                    message: replaceVariables(messages.kickMessage, { username }),
                    title: `Member Kicked`,
                    icon: `https://mc-heads.net/avatar/${username}`,
                    color: 15548997,
                    channel: 'Guild'
                })
            ];
        }

        if (this.isPromotionMessage(message)) {
            const username = message
                .replace(/\[(.*?)\]/g, '')
                .trim()
                .split(/ +/g)[0];
            const rank = message
                .replace(/\[(.*?)\]/g, '')
                .trim()
                .split(' to ')
                .pop()
                .trim();
            return [
                this.minecraft.broadcastCleanEmbed({
                    message: replaceVariables(messages.promotionMessage, {
                        username,
                        rank
                    }),
                    color: 2067276,
                    channel: 'Guild'
                }),
                this.minecraft.broadcastCleanEmbed({
                    message: replaceVariables(messages.promotionMessage, {
                        username,
                        rank
                    }),
                    color: 2067276,
                    channel: 'Logger'
                })
            ];
        }

        if (this.isDemotionMessage(message)) {
            const username = message
                .replace(/\[(.*?)\]/g, '')
                .trim()
                .split(/ +/g)[0];
            const rank = message
                .replace(/\[(.*?)\]/g, '')
                .trim()
                .split(' to ')
                .pop()
                .trim();
            return [
                this.minecraft.broadcastCleanEmbed({
                    message: replaceVariables(messages.demotionMessage, {
                        username,
                        rank
                    }),
                    color: 15548997,
                    channel: 'Guild'
                }),
                this.minecraft.broadcastCleanEmbed({
                    message: replaceVariables(messages.demotionMessage, {
                        username,
                        rank
                    }),
                    color: 15548997,
                    channel: 'Logger'
                })
            ];
        }

        if (this.isCannotMuteMoreThanOneMonth(message)) {
            return this.minecraft.broadcastCleanEmbed({
                message: messages.cannotMuteMoreThanOneMonthMessage,
                color: 15548997,
                channel: 'Guild'
            });
        }

        if (this.isBlockedMessage(message)) {
            const blockedMsg = message.match(/".+"/g)[0].slice(1, -1);
            return this.minecraft.broadcastCleanEmbed({
                message: replaceVariables(messages.messageBlockedByHypixel, {
                    message: blockedMsg
                }),
                color: 15548997,
                channel: 'Guild'
            });
        }

        if (this.isRepeatMessage(message)) {
            client.channels.cache.get(config.discord.channels.guildChatChannel).send({
                embeds: [
                    {
                        color: 15548997,
                        description: messages.repeatMessage
                    }
                ]
            });

            try {
                if (config.discord.replication.enabled) {
                    replication_client.channels.cache.get(config.discord.replication.channels.guild).send({
                        embeds: [
                            {
                                color: 15548997,
                                description: messages.repeatMessage
                            }
                        ]
                    });
                }
            } catch (e) {
                Logger.errorMessage('Failed to broadcast to replication!');
            }
            return;
        }

        if (this.isNoPermission(message)) {
            return this.minecraft.broadcastCleanEmbed({
                message: messages.noPermissionMessage,
                color: 15548997,
                channel: 'Guild'
            });
        }

        if (this.isMuted(message)) {
            const formattedMessage = message.split(' ').slice(1).join(' ');
            this.minecraft.broadcastHeadedEmbed({
                message: formattedMessage.charAt(0).toUpperCase() + formattedMessage.slice(1),

                title: `Bot is currently muted.`,
                color: 15548997,
                channel: 'Guild'
            });
            process.exit(123);
        }

        if (this.isIncorrectUsage(message)) {
            return this.minecraft.broadcastCleanEmbed({
                message: message.split("'").join('`'),
                color: 15548997,
                channel: 'Guild'
            });
        }

        if (this.isAlreadyBlacklistedMessage(message)) {
            return this.minecraft.broadcastHeadedEmbed({
                message: messages.alreadyBlacklistedMessage,
                title: `Blacklist`,
                color: 2067276,
                channel: 'Guild'
            });
        }

        if (this.isBlacklistMessage(message)) {
            const username = message.split(' ')[1];

            return [
                this.minecraft.broadcastHeadedEmbed({
                    message: replaceVariables(messages.blacklistMessage, {
                        username
                    }),
                    title: `Blacklist`,
                    color: 2067276,
                    channel: 'Guild'
                }),
                this.minecraft.broadcastHeadedEmbed({
                    message: replaceVariables(messages.blacklistMessage, {
                        username
                    }),
                    title: `Blacklist`,
                    color: 2067276,
                    channel: 'Logger'
                })
            ];
        }

        if (this.isBlacklistRemovedMessage(message)) {
            const username = message.split(' ')[1];
            return [
                this.minecraft.broadcastHeadedEmbed({
                    message: replaceVariables(messages.blacklistRemoveMessage, {
                        username
                    }),
                    title: `Blacklist`,
                    color: 2067276,
                    channel: 'Guild'
                }),
                this.minecraft.broadcastHeadedEmbed({
                    message: replaceVariables(messages.blacklistRemoveMessage, {
                        username
                    }),
                    title: `Blacklist`,
                    color: 2067276,
                    channel: 'Logger'
                })
            ];
        }

        if (this.isOnlineInvite(message)) {
            const username = message
                .replace(/\[(.*?)\]/g, '')
                .trim()
                .split(/ +/g)[2];
            return [
                /*
                this.minecraft.broadcastCleanEmbed({
                    message: replaceVariables(messages.onlineInvite, { username }),
                    color: 2067276,
                    channel: 'Guild'
                }),*/
                this.minecraft.broadcastCleanEmbed({
                    message: replaceVariables(messages.onlineInvite, { username }),
                    color: 2067276,
                    channel: 'Logger'
                })
            ];
        }

        if (this.isOfflineInvite(message)) {
            const username = message
                .replace(/\[(.*?)\]/g, '')
                .trim()
                .split(/ +/g)[6]
                .match(/\w+/g)[0];
            return [
                /*this.minecraft.broadcastCleanEmbed({
                    message: replaceVariables(messages.offlineInvite, { username }),
                    color: 2067276,
                    channel: 'Guild'
                }),*/
                this.minecraft.broadcastCleanEmbed({
                    message: replaceVariables(messages.offlineInvite, { username }),
                    color: 2067276,
                    channel: 'Logger'
                })
            ];
        }

        if (this.isFailedInvite(message)) {
            return [
                /*this.minecraft.broadcastCleanEmbed({
                    message: message.replace(/\[(.*?)\]/g, '').trim(),
                    color: 15548997,
                    channel: 'Guild'
                }),*/
                this.minecraft.broadcastCleanEmbed({
                    message: message.replace(/\[(.*?)\]/g, '').trim(),
                    color: 15548997,
                    channel: 'Logger'
                })
            ];
        }

        if (this.isGuildMuteMessage(message)) {
            const time = message
                .replace(/\[(.*?)\]/g, '')
                .trim()
                .split(/ +/g)[7];
            return [
                this.minecraft.broadcastCleanEmbed({
                    message: replaceVariables(messages.guildMuteMessage, { time }),
                    color: 15548997,
                    channel: 'Guild'
                }),
                this.minecraft.broadcastCleanEmbed({
                    message: replaceVariables(messages.guildMuteMessage, { time }),
                    color: 15548997,
                    channel: 'Logger'
                })
            ];
        }

        if (this.isGuildUnmuteMessage(message)) {
            return [
                this.minecraft.broadcastCleanEmbed({
                    message: messages.guildUnmuteMessage,
                    color: 2067276,
                    channel: 'Guild'
                }),
                this.minecraft.broadcastCleanEmbed({
                    message: messages.guildUnmuteMessage,
                    color: 2067276,
                    channel: 'Logger'
                })
            ];
        }

        if (this.isUserMuteMessage(message)) {
            const username = message
                .replace(/\[(.*?)\]/g, '')
                .trim()
                .split(/ +/g)[3]
                .replace(/[^\w]+/g, '');
            const time = message
                .replace(/\[(.*?)\]/g, '')
                .trim()
                .split(/ +/g)[5];
            return [
                this.minecraft.broadcastCleanEmbed({
                    message: replaceVariables(messages.userMuteMessage, {
                        username,
                        time
                    }),
                    color: 15548997,
                    channel: 'Guild'
                }),
                this.minecraft.broadcastCleanEmbed({
                    message: replaceVariables(messages.userMuteMessage, {
                        username,
                        time
                    }),
                    color: 15548997,
                    channel: 'Logger'
                })
            ];
        }

        if (this.isUserUnmuteMessage(message)) {
            const username = message
                .replace(/\[(.*?)\]/g, '')
                .trim()
                .split(/ +/g)[3];
            return [
                this.minecraft.broadcastCleanEmbed({
                    message: replaceVariables(messages.userUnmuteMessage, {
                        username
                    }),
                    color: 2067276,
                    channel: 'Guild'
                }),
                this.minecraft.broadcastCleanEmbed({
                    message: replaceVariables(messages.userUnmuteMessage, {
                        username
                    }),
                    color: 2067276,
                    channel: 'Logger'
                })
            ];
        }

        if (this.isSetrankFail(message)) {
            return this.minecraft.broadcastCleanEmbed({
                message: messages.setrankFailMessage,
                color: 15548997,
                channel: 'Guild'
            });
        }

        if (this.isGuildQuestCompletion(message)) {
            this.minecraft.broadcastHeadedEmbed({
                title: 'Guild Quest Completion',
                message: message,
                color: 15844367,
                channel: 'Guild'
            });
        }

        if (this.isAlreadyMuted(message)) {
            return this.minecraft.broadcastCleanEmbed({
                message: messages.alreadyMutedMessage,
                color: 15548997,
                channel: 'Guild'
            });
        }

        if (this.isNotInGuild(message)) {
            const username = message
                .replace(/\[(.*?)\]/g, '')
                .trim()
                .split(' ')[0];
            return this.minecraft.broadcastCleanEmbed({
                message: replaceVariables(messages.notInGuildMessage, {
                    username
                }),
                color: 15548997,
                channel: 'Guild'
            });
        }

        if (this.isLowestRank(message)) {
            const username = message
                .replace(/\[(.*?)\]/g, '')
                .trim()
                .split(' ')[0];
            return this.minecraft.broadcastCleanEmbed({
                message: replaceVariables(messages.lowestRankMessage, {
                    username
                }),
                color: 15548997,
                channel: 'Guild'
            });
        }

        if (this.isAlreadyHasRank(message)) {
            return this.minecraft.broadcastCleanEmbed({
                message: messages.alreadyHasRankMessage,
                color: 15548997,
                channel: 'Guild'
            });
        }

        if (this.isTooFast(message)) {
            return Logger.warnMessage(message);
        }

        if (this.isPlayerNotFound(message)) {
            const username = message.split(' ')[8].slice(1, -1);
            return this.minecraft.broadcastCleanEmbed({
                message: replaceVariables(messages.playerNotFoundMessage, {
                    username
                }),
                color: 15548997,
                channel: 'Guild'
            });
        }

        if (this.isGuildLevelUpMessage(message)) {
            const level = message
                .replace(/\[(.*?)\]/g, '')
                .trim()
                .split(/ +/g)[5];
            return this.minecraft.broadcastCleanEmbed({
                message: replaceVariables(messages.guildLevelUpMessage, { level }),
                color: 16766720,
                channel: 'Guild'
            });
        }

        /*if (this.isPartyMessage(message)) {
      this.minecraft.broadcastCleanEmbed({ 
        message: `${message}`, 
        color: 15548997, 
        channel: 'Guild' 
      })  
    }*/

        const regex =
            config.discord.other.messageMode === 'minecraft'
                ? /^(?<chatType>§[0-9a-fA-F](Guild|Officer)) > (?<rank>§[0-9a-fA-F](?:\[.*?\])?)?\s*(?<username>[^§\s]+)\s*(?:(?<guildRank>§[0-9a-fA-F](?:\[.*?\])?))?\s*§f: (?<message>.*)/
                : /^(?<chatType>\w+) > (?:(?:\[(?<rank>[^\]]+)\] )?(?:(?<username>\w+)(?: \[(?<guildRank>[^\]]+)\])?: )?)?(?<message>.+)$/;

        const match = (config.discord.other.messageMode === 'minecraft' ? colouredMessage : message).match(regex);

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
            const getMessage = /^(?<username>(?!https?:\/\/)[^\s»:>]+)\s*[»:>]\s*(?<message>.*)/;

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

    isAlreadyBlacklistedMessage(message) {
        return (
            message.includes(`You've already ignored that player! /ignore remove Player to unignore them!`) &&
            !message.includes(':')
        );
    }
    isBlacklistRemovedMessage(message) {
        return message.startsWith('Removed') && message.includes('from your ignore list.') && !message.includes(':');
    }

    isBlacklistMessage(message) {
        return message.startsWith('Added') && message.includes('to your ignore list.') && !message.includes(':');
    }

    isGuildMessage(message) {
        return message.startsWith('Guild >') && message.includes(':');
    }

    isOfficerMessage(message) {
        return message.startsWith('Officer >') && message.includes(':');
    }

    isGuildQuestCompletion(message) {
        return message.includes('GUILD QUEST TIER ') && message.includes('COMPLETED') && !message.includes(':');
    }

    isLoginMessage(message) {
        return message.startsWith('Guild >') && message.endsWith('joined.') && !message.includes(':');
    }

    isLogoutMessage(message) {
        return message.startsWith('Guild >') && message.endsWith('left.') && !message.includes(':');
    }

    isJoinMessage(message) {
        return message.includes('joined the guild!') && !message.includes(':');
    }

    isLeaveMessage(message) {
        return message.includes('left the guild!') && !message.includes(':');
    }

    isKickMessage(message) {
        return message.includes('was kicked from the guild by') && !message.includes(':');
    }

    isPartyMessage(message) {
        return message.includes('has invited you to join their party!') && !message.includes(':');
    }

    isPromotionMessage(message) {
        return message.includes('was promoted from') && !message.includes(':');
    }

    isDemotionMessage(message) {
        return message.includes('was demoted from') && !message.includes(':');
    }

    isRequestMessage(message) {
        return message.includes('has requested to join the Guild!');
    }

    isBlockedMessage(message) {
        return message.includes('We blocked your comment') && !message.includes(':');
    }

    isRepeatMessage(message) {
        return message == 'You cannot say the same message twice!';
    }

    isNoPermission(message) {
        return (
            (message.includes('You must be the Guild Master to use that command!') ||
                message.includes('You do not have permission to use this command!') ||
                message.includes(
                    "I'm sorry, but you do not have permission to perform this command. Please contact the server administrators if you believe that this is in error."
                ) ||
                message.includes('You cannot mute a guild member with a higher guild rank!') ||
                message.includes('You cannot kick this player!') ||
                message.includes('You can only promote up to your own rank!') ||
                message.includes('You cannot mute yourself from the guild!') ||
                message.includes("is the guild master so can't be demoted!") ||
                message.includes("is the guild master so can't be promoted anymore!") ||
                message.includes('You do not have permission to kick people from the guild!')) &&
            !message.includes(':')
        );
    }

    isIncorrectUsage(message) {
        return message.includes('Invalid usage!') && !message.includes(':');
    }

    isOnlineInvite(message) {
        return (
            message.includes('You invited') &&
            message.includes('to your guild. They have 5 minutes to accept.') &&
            !message.includes(':')
        );
    }

    isOfflineInvite(message) {
        return (
            message.includes('You sent an offline invite to') &&
            message.includes('They will have 5 minutes to accept once they come online!') &&
            !message.includes(':')
        );
    }

    isFailedInvite(message) {
        return (
            (message.includes('is already in another guild!') ||
                message.includes('You cannot invite this player to your guild!') ||
                (message.includes("You've already invited") &&
                    message.includes('to your guild! Wait for them to accept!')) ||
                message.includes('is already in your guild!')) &&
            !message.includes(':')
        );
    }

    isUserMuteMessage(message) {
        return message.includes('has muted') && message.includes('for') && !message.includes(':');
    }

    isUserUnmuteMessage(message) {
        return message.includes('has unmuted') && !message.includes(':');
    }

    isCannotMuteMoreThanOneMonth(message) {
        return message.includes('You cannot mute someone for more than one month') && !message.includes(':');
    }

    isGuildMuteMessage(message) {
        return message.includes('has muted the guild chat for') && !message.includes(':');
    }

    isGuildUnmuteMessage(message) {
        return message.includes('has unmuted the guild chat!') && !message.includes(':');
    }

    isSetrankFail(message) {
        return message.includes("I couldn't find a rank by the name of ") && !message.includes(':');
    }

    isAlreadyMuted(message) {
        return message.includes('This player is already muted!') && !message.includes(':');
    }

    isNotInGuild(message) {
        return message.includes(' is not in your guild!') && !message.includes(':');
    }

    isLowestRank(message) {
        return message.includes("is already the lowest rank you've created!") && !message.includes(':');
    }

    isAlreadyHasRank(message) {
        return message.includes('They already have that rank!') && !message.includes(':');
    }

    isLobbyJoinMessage(message) {
        return (message.endsWith(' the lobby!') || message.endsWith(' the lobby! <<<')) && message.includes('[MVP+');
    }

    isTooFast(message) {
        return message.includes('You are sending commands too fast! Please slow down.') && !message.includes(':');
    }

    isMuted(message) {
        return message.includes('Your mute will expire in') && !message.includes(':');
    }

    isPlayerNotFound(message) {
        return message.startsWith(`Can't find a player by the name of`);
    }

    isGuildLevelUpMessage(message) {
        return message.includes('The guild has reached Level') && !message.includes(':');
    }

    isDirectMessage(message) {
        return (message.startsWith('From '));
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
