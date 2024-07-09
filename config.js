require('dotenv').config();

module.exports = {
    minecraft: {
        bot: {
            prefix: '!',
            messageFormat: '{username} » {message}',
            messageRepeatBypassLength: 28,
            unique_id: process.env.unique_id,
            guild_prefix: process.env.guild_prefix,
            replication_prefix: process.env.replica_prefix
        },
        commands: {
            normal: true,
            soopy: process.env.soopy == 'true',
            /*
                true (integrated)   = send image link in the minecraft message
                false (discrete)    = replace image with text where possible
            */
            integrate_images: false
        },
        guild: {
            guildExp: 50000,
            guildId: process.env.guild_id,
            guildName: process.env.guild_name,
            join_message_override: process.env.join_message_override === 'true',
            join_message: process.env.join_message
        },
        API: {
            hypixelAPIkey: process.env.keys_hypixel,
            imgurAPIkey: process.env.keys_imgur,
            skykingsAPIkey: process.env.keys_skykings,

            mojang_resolver: false,
            useImgur: false,

            banlist: {
                enabled: process.env.banlist_enabled == 'true',
                URL: process.env.banlist_url,
                skykings: process.env.skykings_enabled == 'true'
            },

            SCF: {
                enabled: process.env.scf_enabled == 'true',
                key: process.env.scf_api,
                fail_webhook: process.env.scf_fail_webhook,
                logo: process.env.scf_logo
            }
        },
        guildRequirements: {
            enabled: process.env.req_enabled == 'true',
            autoAccept: process.env.req_autoaccept == 'true',
            requirements: {
                skyblockLevel: parseInt(process.env.req_sb_lvl) || 0,
                catacombsLevel: parseInt(process.env.req_cata) || 0,
                masteries: {
                    masteriesEnabled: process.env.masteries_enabled,
                    maximumFailed: parseInt(process.env.max_failed_masteries) || 0,

                    networth: parseInt(process.env.mastery_networth) || 0,
                    skyblockLevel: parseInt(process.env.mastery_sb_lvl) || 0,
                    skillAverage: parseInt(process.env.mastery_sa) || 0,
                    slayerEXP: parseInt(process.env.mastery_slayers) || 0,
                    catacombsLevel: parseInt(process.env.mastery_cata) || 0
                }
            }
        },
        skyblockEventsNotifications: {
            enabled: process.env.events_notifications == 'true',
            notifiers: {
                BANK_INTEREST: true,
                DARK_AUCTION: true,
                ELECTION_BOOTH_OPENS: true,
                ELECTION_OVER: true,
                FALLEN_STAR_CULT: true,
                FEAR_MONGERER: true,
                JACOBS_CONTEST: true,
                JERRYS_WORKSHOP: true,
                NEW_YEAR_CELEBRATION: true,
                SEASON_OF_JERRY: true,
                SPOOKY_FESTIVAL: true,
                TRAVELING_ZOO: true,
                HOPPITY_HUNT: true
            },
            customTime: {
                3: ['BANK_INTEREST', 'DARK_AUCTION', 'JACOBS_CONTEST'],
                5: [
                    'ELECTION_BOOTH_OPENS',
                    'ELECTION_OVER',
                    'FALLEN_STAR_CULT',
                    'FEAR_MONGERER',
                    'JERRYS_WORKSHOP',
                    'NEW_YEAR_CELEBRATION',
                    'SEASON_OF_JERRY',
                    'TRAVELING_ZOO',
                    'SPOOKY_FESTIVAL',
                    'HOPPITY_HUNT'
                ],
                30: [
                    'BANK_INTEREST',
                    'DARK_AUCTION',
                    'JACOBS_CONTEST',
                    'ELECTION_BOOTH_OPENS',
                    'ELECTION_OVER',
                    'FALLEN_STAR_CULT',
                    'FEAR_MONGERER',
                    'JERRYS_WORKSHOP',
                    'NEW_YEAR_CELEBRATION',
                    'SEASON_OF_JERRY',
                    'TRAVELING_ZOO',
                    'SPOOKY_FESTIVAL',
                    'HOPPITY_HUNT'
                ]
            }
        },
        hypixelUpdates: {
            enabled: process.env.hypixel_updates == 'true',
            hypixelNews: true,
            statusUpdates: true,
            skyblockVersion: true
        }
    },
    discord: {
        bot: {
            token: process.env.discord_token,
            serverID: process.env.discord_server
        },
        channels: {
            guildChatChannel: process.env.channel_guild,
            officerChannel: process.env.channel_officer,
            loggingChannel: process.env.channel_logging,
            debugMode: true,
            debugChannel: process.env.channel_debug,
            allowedBots: ['155149108183695360', '1224056601829441619', '1049379596006588417']
        },
        replication: {
            enabled: process.env.replica_enabled == 'true',
            token: process.env.replica_token,
            serverID: process.env.replica_server,
            channels: {
                guild: process.env.replica_guild,
                officer: process.env.replica_officer,
                logging: process.env.replica_logging,
                debug: false
            },
            permissions: {
                mod: [
                    '924332988743966751',
                    '801634222577156097', // SBU MODS
                    '1048690255903072339',
                    '1048690255903072340' // SCF MODS
                ],
                admin: [
                    '808070562046935060',
                    '766041783137468506',
                    '803275569356865556 ', // SBU ADMINS
                    '1203459776667979808',
                    '1048690255903072342',
                    '1220104308767588503',
                    '1061976889570369538', // SCF ADMINS
                    process.env.guild_admin_id // GUILD ADMINS
                ],
                ownerIDs: [
                    process.env.guildmaster_id,
                    '476365125922586635' // Guild owner + me
                ],
                dev: ['819237478073499648']
            }
        },
        GCL: {
            // Guild Cross Link Settings
            // WARNING! Make sure to add required bridges to config.discord.channels.allowedBots, otherwise it wont work.
            enabled: process.env.gcl_enabled == 'true',
            settings: {
                console: process.env.gcl_console,
                channels: {
                    guild: process.env.gcl_link_guild == 'true',
                    officer: process.env.gcl_link_officer == 'true'
                }
            }
        },
        commands: {
            checkPerms: true,
            permissions: {
                mod: [
                    '924332988743966751',
                    '801634222577156097', // SBU MODS
                    '1048690255903072339',
                    '1048690255903072340' // SCF MODS
                ],
                admin: [
                    '808070562046935060',
                    '766041783137468506',
                    '803275569356865556 ', // SBU ADMINS
                    '1203459776667979808',
                    '1048690255903072342',
                    '1220104308767588503',
                    '1061976889570369538', // SCF ADMINS
                    process.env.guild_admin_id // GUILD ADMINS
                ],
                ownerIDs: [
                    process.env.guildmaster_id,
                    '476365125922586635' // Guild owner + me
                ],
                dev: ['819237478073499648']
            },
            notifyRole: process.env.notify_role
        },
        other: {
            messageMode: 'bot',
            filterMessages: true,
            filterWords: ['dox', 'doxx', 'doxed', 'doxxed', 'doxing', 'doxxing', 'doxes', 'doxxes', 'ez', 'ip'],
            joinMessage: true,
            autoLimbo: true
        }
    },
    longpoll: {
        enabled: true,
        provider: "https://sky.dssoftware.ru/longpoll/"
    }
};
