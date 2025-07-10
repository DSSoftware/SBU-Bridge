const { getLatestProfile } = require("../../../API/functions/getLatestProfile.js");
const { getPersonalBest } = require("../../../API/stats/dungeonsPersonalBest.js");
const minecraftCommand = require("../../contracts/minecraftCommand.js");
const prettyms = require("pretty-ms");
const { formatUsername } = require('../../contracts/helperFunctions.js');

class PersonalBestCommand extends minecraftCommand {
    /** @param {import("minecraft-protocol").Client} minecraft */
    constructor(minecraft) {
        super(minecraft);

        this.name = "personalbest";
        this.aliases = ["personalbest", "pb"];
        this.description = "Returns the fastest time (s+) of any dungeon";
        this.options = [
            {
                name: "username",
                description: "Minecraft Username",
                required: false
            },
            {
                name: "Floor",
                description: "Floor of dungeons (M7, F7, ect)",
                required: false
            }
        ];
    }

    async onCommand(username, message, channel = 'gc') {
        try {
            const args = this.getArgs(message);
            
            // Parse arguments more intelligently
            let targetPlayer = username; // Default to command issuer
            let floor = "m7"; // Default floor
            let rank = "s+"; // Default rank
            
            // If we have arguments, parse them
            if (args.length > 0) {
                // Check if first argument is a floor (starts with f, m, or is 'e')
                const firstArg = args[0].toLowerCase();
                const isFloor = /^(e|f[1-7]|m[1-7])$/.test(firstArg);
                
                if (isFloor) {
                    // First argument is a floor, so use command issuer as player
                    floor = firstArg;
                    rank = args[1] ? args[1].toLowerCase() : "s+";
                } else {
                    // First argument is a player name
                    targetPlayer = args[0];
                    floor = args[1] ? args[1].toLowerCase() : "m7";
                    rank = args[2] ? args[2].toLowerCase() : "s+";
                }
            }

            const data = await getLatestProfile(targetPlayer);

            const formattedUsername = formatUsername(targetPlayer, data.profileData?.game_mode);

            const floors = ["e", "f1", "f2", "f3", "f4", "f5", "f6", "f7", "m1", "m2", "m3", "m4", "m5", "m6", "m7"];
            const ranks = ["", "any", "s", "s+"];
            
            if (floors.includes(floor) === false) {
                throw "Invalid Usage: !pb [user] [floor (m7/f4/etc)] [rank (S+, S, any)] or !pb [floor] [rank]";
            }

            if (ranks.includes(rank) === false) {
                throw "Invalid Usage: !pb [user] [floor (m7/f4/etc)] [rank (S+, S, any)] or !pb [floor] [rank]";
            }

            const personalBest = getPersonalBest(data.profile);
            if (personalBest === null || personalBest === undefined) {
                throw `${formattedUsername} has never done dungeons before.`;
            }

            const dungeonType = floor.at(0) === "m" ? "master" : "normal";
            const dungeon = floor.at(0) === "m" ? personalBest.master : personalBest.normal;
            const floorNumber = floor.at(1);

            // Check if dungeon type exists
            if (!dungeon) {
                throw `${formattedUsername} has no ${dungeonType} dungeon data.`;
            }

            const floorData = dungeon[`floor_${floorNumber}`];
            
            // Check if floor data exists
            if (!floorData) {
                throw `${formattedUsername} has never completed ${floor.toUpperCase()}.`;
            }

            const rankType = rank === "s+" ? "fastest_s_plus" : rank === "s" ? "fastest_s" : "fastest";
            const time = floorData[rankType];
            
            if (time === null || time === undefined) {
                throw `${formattedUsername} has no PB on ${floor.toUpperCase()} with ${rank.toUpperCase()} rank.`;
            }

            this.send(`/${channel} ${formattedUsername}'s PB on ${floor.toUpperCase()} with ${rank.toUpperCase()} rank is ${prettyms(time, { secondsDecimalDigits: 0 })}`);
        } catch (error) {
            if (typeof error === 'string') {
                this.send(`/${channel} ${error}`);
            } else {
                this.send(`/${channel} [ERROR] ${error.message || 'An unexpected error occurred'}`);
            }
        }
    }
}

module.exports = PersonalBestCommand;