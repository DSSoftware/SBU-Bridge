class Config {
    getConfig() {
        return {
            API: {
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
                    messageRepeatBypassLength: 28,
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
        };
    }
}

module.exports = new Config();
