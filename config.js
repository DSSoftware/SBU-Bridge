class Config {
    getConfig() {
        return {
            API: {
                hypixelAPIkey: this.env('keys_hypixel'),
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
                },
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
                }
            },
            discord: {
                channels: {
                    allowedBots: ['155149108183695360', '1224056601829441619', '1049379596006588417']
                }
            },
        };
    }
}

module.exports = new Config();
