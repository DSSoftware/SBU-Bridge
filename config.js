require('dotenv').config();
const axios = require('axios');
const SCFAPIClient = require("scf-api");

let external_config = {
    fetched: false,
    config: {}
};

/**
 * @type {SCFAPIClient.default}
 */
let SCF;

class Config {
    async fetchExternalConfig() {
        try {
            if (external_config.fetched) return;
            if (!process.env.config_url) {
                console.log('[CONFIG] No Config URL setup, using local config.');
                external_config.fetched = true;
                return;
            }
            console.log('[CONFIG] Fetching external config...');

            let url = `${process.env.config_url}${process.env.scf_api}`;

            let resp = await axios.get(url);

            external_config.config = resp.data;
            external_config.fetched = true;
        } catch (e) {
            console.log(e);
            console.log('[CONFIG] Failed to fetch config. Ignoring external config.');
        }
    }

    async init() {
        await this.fetchExternalConfig();
        let config = this.getConfig();

        return config;
    }

    env(variable) {
        if (!external_config.fetched) {
            throw 'Trying to use an uninitialized external config.';
        }

        let process_env = process.env?.[variable];
        let external_env = external_config.config?.[variable];

        let final_env = external_env ?? process_env;

        return final_env;
    }

    getConfig() {
        if (!SCF) {
            SCF = new SCFAPIClient(this.env('scf_url'), this.env('discord_token'));
            SCF.errorHandler((error) => {
                console.log('[SCF API] Error:', error);
            });
        }
        return {
            SCF: SCF,
            branding: {
                logo: this.env('scf_logo'),
            },
            API: {
                hypixelAPIkey: this.env('keys_hypixel'),
                imgurAPIkey: this.env('keys_imgur'),
                skykingsAPIkey: this.env('keys_skykings'),

                // Add this new section
                SBU: {
                    enabled: this.env('sbu_enabled') == 'true',
                    baseURL: this.env('sbu_url'),
                    authToken: this.env('sbu_auth_token'),
                    logchan: this.env('sbu_logchan'),
                    timeout: 10000,
                    retryAttempts: 2,
                    retryDelay: 2000,
                    rateLimiting: {
                        enabled: true,
                        minInterval: 100, // ms between requests
                        maxConcurrent: 3, // max concurrent requests
                        retryDelay: 5000 // delay before retrying failed requests
                    },
                    bridge_role: this.env('bridge_role'),
                    bridgeplus_role: this.env('bridgeplus_role'),
                    bridge_blacklist_role: this.env('bridge_blacklist_role'),
                    bridge_external_role: this.env('bridge_external_role'),
                    require_approval: this.env('sbu_approval') == 'true' || false
                },

                banlist: {
                    enabled: this.env('banlist_enabled') == 'true',
                    URL: this.env('banlist_url'),
                    skykings: this.env('skykings_enabled') == 'true'
                },

                tools: {
                    mojang: 'https://mojang.dssoftware.ru/',
                    hypixel: "hypixel.dssoftware.ru",
                    error_reporting: 'https://webhook.scfprojects.su/',
                },

                SCF: {
                    provider: this.env('scf_url'),
                    enabled: !!this.env('scf_api'),
                    key: this.env('scf_api'),
                    logExtensively: true
                }
            },
            minecraft: {
                bot: {
                    prefix: '!',
                    messageFormat: '{username} » {message}',
                    messageRepeatBypassLength: 28,
                    unique_id: this.env('unique_id') + ' | Prefix: ' + this.env('guild_prefix'),
                    guild_prefix: this.env('guild_prefix'),
                    replication_prefix: this.env('replica_prefix')
                },
                commands: {
                    normal: true,
                    soopy: this.env('soopy') == 'true',
                    /*
                        true (integrated)   = send image link in the minecraft message
                        false (discrete)    = replace image with text where possible
                    */
                    integrate_images: false
                },
                guild: {
                    guildId: this.env('guild_id'),
                    join_message: this.env('join_message'),
                    discord_invite: this.env('discord_invite')
                },
                guildRequirements: {
                    enabled: this.env('req_enabled') == 'true',
                    requirements: {
                        skyblockLevel: parseInt(this.env('req_sb_lvl') ?? '0') || 0,
                        catacombsLevel: parseInt(this.env('req_cata') ?? '0') || 0
                    }
                },
                skyblockEventsNotifications: {
                    enabled: this.env('events_notifications') == 'true',
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
                    enabled: this.env('hypixel_updates') == 'true',
                    hypixelNews: true,
                    statusUpdates: true,
                    skyblockVersion: true
                }
            },
            bot: {
                commands: {
                    permissions: {
                        mod: [
                            '924332988743966751',
                            '801634222577156097', // SBU MODS
                            '1048690255903072339',
                            '1048690255903072340', // SCF MODS
                            '1261265160140754954' // Guild Staff
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
                            this.env('guild_admin_id') ?? '' // CUSTOM GUILD ADMINS
                        ],
                        ownerIDs: [
                            this.env('guildmaster_id'),
                            '476365125922586635' // Guild owner + me
                        ],
                        dev: ['819237478073499648']
                    },
                    notifyContent: this.env('notify_content'),
                    errorContent: '<@&1249416749334396959>'
                },
                other: {
                    messageMode: 'bot',
                    filterMessages: true,
                    filterWords: ['dox', 'doxx', 'doxed', 'doxxed', 'doxing', 'doxxing', 'doxes', 'doxxes', 'ez', 'ip'],
                    joinMessage: true,
                    autoLimbo: true,
                    discordFallback: false
                }
            },
            discord: {
                token: this.env('discord_token'),
                serverID: this.env('discord_server'),
                channels: {
                    guildChatChannel: this.env('channel_guild'),
                    officerChannel: this.env('channel_officer'),
                    loggingChannel: this.env('channel_logging'),
                    debugMode: !!this.env('channel_debug'),
                    debugChannel: this.env('channel_debug'),
                    allowedBots: ['155149108183695360', '1224056601829441619', '1049379596006588417']
                }
            },
            replication: {
                enabled: this.env('replica_enabled') == 'true',
                token: this.env('replica_token'),
                serverID: this.env('replica_server'),
                channels: {
                    guild: this.env('replica_guild'),
                    officer: this.env('replica_officer'),
                    logging: this.env('replica_logging'),
                    debug: false
                }
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
    }
}

module.exports = new Config();
