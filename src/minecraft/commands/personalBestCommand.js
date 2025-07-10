const { getLatestProfile } = require("../../../API/functions/getLatestProfile.js");
const { getPersonalBest } = require("../../../API/stats/dungeonsPersonalBest.js");
const minecraftCommand = require("../../contracts/minecraftCommand.js");
const prettyms = require("pretty-ms");
const { formatUsername } = require('#/src/contracts/helperFunctions');

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

        username = this.getArgs(message)[0] || username;

        const data = await getLatestProfile(username, { museum: true });

        username = formatUsername(username, data.profileData?.game_mode);

        const floor = (this.getArgs(message)[1] ?? "M7").toLowerCase();
        const rank = (this.getArgs(message)[2] ?? "S+").toLowerCase();
        const floors = ["e", "f1", "f2", "f3", "f4", "f5", "f6", "f7", "m1", "m2", "m3", "m4", "m5", "m6", "m7"];
        const ranks = ["", "any", "s", "s+"];
        if (floors.includes(floor) === false) {
            // eslint-disable-next-line no-throw-literal
            throw "Invalid Usage: !pb [user] [floor (m7/f4/etc)] [rank (S+, S, any)]";
        }

        if (ranks.includes(rank) === false) {
            // eslint-disable-next-line no-throw-literal
            throw "Invalid Usage: !pb [user] [floor (m7/f4/etc)] [rank (S+, S, any)]";
        }

        const personalBest = getPersonalBest(profile);
        if (personalBest === null) {
            // eslint-disable-next-line no-throw-literal
            throw `${username} has never done dungeons before.`;
        }

        const dungeon = floor.at(0) === "m" ? personalBest.master : personalBest.normal;
        const floorNumber = floor.at(1);
        // @ts-ignore
        const floorData = dungeon[`floor_${floorNumber}`];
        const rankType = rank === "s+" ? "fastest_s_plus" : rank === "s" ? "fastest_s" : "fastest";

        const time = floorData[rankType];
        if (time === null) {
            // eslint-disable-next-line no-throw-literal
            throw `${username} has no PB on ${floor} ${rank}`;
        }

        // @ts-ignore
        this.send(`${username}'s PB on ${floor.toUpperCase()} with ${rank.toUpperCase()} rank is ${prettyms(time, { secondsDecimalDigits: 0 })}`);
    }
}

module.exports = PersonalBestCommand;