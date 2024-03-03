module.exports = {
  "minecraft": {
    "bot": {
      "prefix": "!",
      "messageFormat": "{username} » {message}",
      "messageRepeatBypassLength": 28,
      "unique_id": process.env.unique_id,
      "guild_prefix": process.env.guild_prefix,
      "replication_prefix": process.env.replica_prefix
    },
    "commands": {
      "normal": true,
      "soopy": process.env.soopy == "true"
    },
    "guild": {
      "guildExp": 50000,
      "guildId": process.env.guild_id,
      "guildName": process.env.guild_name
    },
    "API": {
      "hypixelAPIkey": process.env.keys_hypixel,
      "imgurAPIkey": process.env.keys_imgur,
      "skykingsAPIkey": process.env.keys_skykings,

      "resolvers": {
        "IGN_to_UUID": "https://api.mojang.com/users/profiles/minecraft",
        "UUID_to_IGN": "https://sessionserver.mojang.com/session/minecraft/profile"
      },

      "banlist": {
        "enabled": process.env.banlist_enabled == "true",
        "URL": process.env.banlist_url,
        "skykings": process.env.skykings_enabled == "true"
      },

      "SCF": {
        "enabled": process.env.scf_enabled == "true",
        "key": process.env.scf_api,
        "fail_webhook": process.env.scf_fail_webhook,
        "logo": process.env.scf_logo
      }
    },
    "guildRequirements": {
      "enabled": process.env.req_enabled == "true",
      "autoAccept": process.env.req_autoaccept == "true",
      "requirements": {
        "skyblockLevel": process.env.req_sb_lvl,
        "senitherWeight": process.env.req_weight,
        "catacombsLevel": process.env.req_cata
      }
    },
    "skyblockEventsNotifications": {
      "enabled": true,
      "notifiers": {
        "BANK_INTEREST": true,
        "DARK_AUCTION": true,
        "ELECTION_BOOTH_OPENS": true,
        "ELECTION_OVER": true,
        "FALLEN_STAR_CULT": true,
        "FEAR_MONGERER": true,
        "JACOBS_CONTEST": true,
        "JERRYS_WORKSHOP": true,
        "NEW_YEAR_CELEBRATION": true,
        "SEASON_OF_JERRY": true,
        "SPOOKY_FESTIVAL": true,
        "TRAVELING_ZOO": true
      },
      "customTime": {
        "3": ["BANK_INTEREST", "DARK_AUCTION", "JACOBS_CONTEST"],
        "5": [
          "ELECTION_BOOTH_OPENS",
          "ELECTION_OVER",
          "FALLEN_STAR_CULT",
          "FEAR_MONGERER",
          "JERRYS_WORKSHOP",
          "NEW_YEAR_CELEBRATION",
          "SEASON_OF_JERRY",
          "TRAVELING_ZOO",
          "SPOOKY_FESTIVAL"
        ],
        "30": [
          "BANK_INTEREST",
          "DARK_AUCTION",
          "JACOBS_CONTEST",
          "ELECTION_BOOTH_OPENS",
          "ELECTION_OVER",
          "FALLEN_STAR_CULT",
          "FEAR_MONGERER",
          "JERRYS_WORKSHOP",
          "NEW_YEAR_CELEBRATION",
          "SEASON_OF_JERRY",
          "TRAVELING_ZOO",
          "SPOOKY_FESTIVAL"
        ]
      }
    },
    "hypixelUpdates": {
      "enabled": false,
      "hypixelNews": false,
      "statusUpdates": false,
      "skyblockVersion": false
    }
  },
  "discord": {
    "bot": {
      "token": process.env.discord_token,
      "serverID": process.env.discord_server
    },
    "channels": {
      "guildChatChannel": process.env.channel_guild,
      "officerChannel": process.env.channel_officer,
      "loggingChannel": process.env.channel_logging,
      "debugMode": true,
      "debugChannel": process.env.channel_debug,
      "allowedBots": ["155149108183695360"]
    },
    "replication": {
      "enabled": process.env.replica_enabled == "true",
      "token": process.env.replica_token,
      "serverID": process.env.replica_server,
      "channels": {
        "guild": process.env.replica_guild,
        "officer": process.env.replica_officer,
        "logging": process.env.replica_logging,
        "debug": false
      },
      "permissions": {
        "mod": [
          "924332988743966751", "801634222577156097", // SBU MODS
          "1048690255903072339", "1048690255903072340" // SCF MODS
        ],
        "admin": [
          "808070562046935060", "766041783137468506", "803275569356865556 ", // SBU ADMINS
          "1203459776667979808", "1048690255903072342", "1048690255903072343", "1048690255903072344", // SCF ADMINS
          process.env.guild_admin_id // GUILD ADMINS
        ],
        "ownerIDs": [
          process.env.guildmaster_id, "476365125922586635" // Guild owner + me
        ],
        "dev": ["819237478073499648"]
      }
    },
    "commands": {
      "checkPerms": true,
      "permissions": {
        "mod": [
          "924332988743966751", "801634222577156097", // SBU MODS
          "1048690255903072339", "1048690255903072340" // SCF MODS
        ],
        "admin": [
          "808070562046935060", "766041783137468506", "803275569356865556 ", // SBU ADMINS
          "1203459776667979808", "1048690255903072342", "1048690255903072343", "1048690255903072344", // SCF ADMINS
          process.env.guild_admin_id // GUILD ADMINS
        ],
        "ownerIDs": [
          process.env.guildmaster_id, "476365125922586635" // Guild owner + me
        ],
        "dev": ["819237478073499648"]
      },
      "notifyRole": process.env.notify_role
    },
    "other": {
      "messageMode": "bot",
      "filterMessages": true,
      "filterWords": ["dox", "doxx", "doxed", "doxxed", "doxing", "doxxing", "doxes", "doxxes", "ez", "ip"],
      "joinMessage": true,
      "autoLimbo": true
    }
  },
  "web": {
    "enabled": false,
    "port": 1439,
    "endpoints": {
      "invite": true,
      "kick": true
    }
  }
}