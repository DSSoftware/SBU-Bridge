require('dotenv').config();

const standaloneOverride = false;
const isStandalone = (process.env.standalone == 'true') || standaloneOverride;

if(isStandalone){
    console.warn("[STANDALONE] Running bridge in standalone mode. Custom features will be disabled.")
}

/*
    Setting bridge to STANDALONE mode means that it will not use any of the
    custom features, such as Cached Mojang Resolver or Player Linking.

    Standalone override FORCES standalone mode if not set in config
*/

module.exports = {
    minecraft: {
        bot: {
            prefix: '!',
            messageFormat: '{username} » {message}',
            messageRepeatBypassLength: 28,
            unique_id: process.env.unique_id + " | Prefix: " + process.env.guild_prefix,
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

            mojang_resolver: isStandalone,
            useImgur: false,

            banlist: {
                enabled: process.env.banlist_enabled == 'true',
                URL: process.env.banlist_url,
                skykings: process.env.skykings_enabled == 'true'
            },

            SCF: {
                provider: "https://sky.dssoftware.ru/api.php",
                mojang: "https://mojang.dssoftware.ru/",
                enabled: (process.env.scf_enabled === 'true') && (!isStandalone),
                key: process.env.scf_api,
                fail_webhook: process.env.scf_fail_webhook,
                logo: process.env.scf_logo
            }
        },
        guildRequirements: {
            enabled: process.env.req_enabled == 'true',
            requirements: {
                skyblockLevel: parseInt(process.env.req_sb_lvl) || 0,
                catacombsLevel: parseInt(process.env.req_cata) || 0
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
                    '1048690255903072340', // SCF MODS
                    '1261265160140754954', // Guild Staff
                ],
                admin: [
                    '808070562046935060',
                    '766041783137468506',
                    '803275569356865556 ', // SBU ADMINS
                    '1370636617303195728',
                    '1048690255903072342',
                    '1220104308767588503',
                    '1061976889570369538', // SCF ADMINS
                    '1266856339406192700', // GUILD ADMINS
                    '1273749696296386581', // SCF Star Role
                    process.env.guild_admin_id // CUSTOM GUILD ADMINS
                ],
                ownerIDs: [
                    process.env.guildmaster_id,
                    '476365125922586635' // Guild owner + me
                ],
                dev: ['819237478073499648']
            }
        },
        IGC: {
            // Inter Guild Chat
            enabled: process.env.igc_enabled == 'true',
            settings: {
                listening: process.env.igc_listening,
                webhook: process.env.igc_webhook,
                webhook_self: process.env.igc_self_id,
                channels: {
                    guild: {
                        enabled: process.env.igc_guild_enabled == "true",
                        prefix: process.env.igc_guild_prefix,
                        commands: process.env.igc_guild_commands == "true"
                    },
                    officer: {
                        enabled: process.env.igc_officer_enabled == "true",
                        prefix: process.env.igc_officer_prefix,
                        commands: process.env.igc_officer_commands == "true"
                    },
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
                    '1048690255903072340', // SCF MODS
                    '1261265160140754954', // Guild Staff
                    process.env.guild_mod_id ?? "" // CUSTOM GUILD MODS
                ],
                admin: [
                    '808070562046935060',
                    '766041783137468506',
                    '803275569356865556 ', // SBU ADMINS
                    '1370636617303195728',
                    '1048690255903072342',
                    '1220104308767588503',
                    '1061976889570369538', // SCF ADMINS
                    '1266856339406192700', // GUILD ADMINS
                    '1273749696296386581', // SCF Star Role
                    process.env.guild_admin_id ?? "" // CUSTOM GUILD ADMINS
                ],
                ownerIDs: [
                    process.env.guildmaster_id,
                    '476365125922586635' // Guild owner + me
                ],
                dev: ['819237478073499648']
            },
            notifyContent: process.env.notify_content,
            errorContent: "<@&1249416749334396959>"
        },
        other: {
            messageMode: 'bot',
            filterMessages: true,
            filterWords: ['dox', 'doxx', 'doxed', 'doxxed', 'doxing', 'doxxing', 'doxes', 'doxxes', 'ez', 'ip'],
            joinMessage: true,
            autoLimbo: true,
            discordFallback: false,
            logExtensively: true
        }
    },
    longpoll: {
        enabled: true && (!isStandalone),
        provider: "https://sky.dssoftware.ru/longpoll/"
    },
    logging: {
        verbose: true
    },
    /*
        Sets default behavior when the feature is disabled by healthcheck:

        FATAL: Crashes the application with a 123 error code (Critical error)
        REPLACE: Uses alternative if possible, otherwise disables feature
    */
    behavior: {
        // User link service, responsible for correct IGN for discord messages.
        Link: 'REPLACE', 
        // Assigns user a score for speaking in guild chat.
        Score: 'REPLACE',
        // Internal SCF API
        InternalAPI: 'REPLACE',
        // Locks user from using bridges. DEPENDS ON LINK SERVICE.
        Bridgelock: 'REPLACE',
        // Provides external action API, used for kicks, invites and more.
        Longpoll: 'REPLACE',
        // Stops unwanted players from joining.
        Blacklist: 'REPLACE',
        // Sends bridge's status to the control server.
        Status: 'REPLACE',
        // Mojang Proxy API. CRITICAL - FATAL or REPLACE REQUIRED.
        Mojang: 'REPLACE',
        // Hypixel Proxy API. CRITICAL - FATAL OR REPLACE REQUIRED.
        Hypixel: 'REPLACE',
        // Logging to Database
        Logging: 'REPLACE'
    }
};
