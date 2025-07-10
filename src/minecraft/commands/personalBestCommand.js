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

            username = this.getArgs(message)[0] || username;

            const data = await getLatestProfile(username);

            const formattedUsername = formatUsername(username, data.profileData?.game_mode);

            const floor = (this.getArgs(message)[1] ?? "M7").toLowerCase();
            const rank = (this.getArgs(message)[2] ?? "S+").toLowerCase();
            const floors = ["e", "f1", "f2", "f3", "f4", "f5", "f6", "f7", "m1", "m2", "m3", "m4", "m5", "m6", "m7"];
            const ranks = ["", "any", "s", "s+"];
            
            if (floors.includes(floor) === false) {
                throw "Invalid Usage: !pb [user] [floor (m7/f4/etc)] [rank (S+, S, any)]";
            }

            if (ranks.includes(rank) === false) {
                throw "Invalid Usage: !pb [user] [floor (m7/f4/etc)] [rank (S+, S, any)]";
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