const { getLatestProfile } = require('../../../API/functions/getLatestProfile.js');
const { formatUsername } = require('../../contracts/helperFunctions.js');
const minecraftCommand = require('../../contracts/minecraftCommand.js');
const { getBestiary } = require('../../../API/stats/bestiary.js');
const Logger = require('#root/src/Logger.js');

class BestiaryCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'bestiary';
        this.aliases = ['be'];
        this.description = 'Bestiary of specified user.';
        this.options = [
            {
                name: 'username',
                description: 'Mincraft Username',
                required: false
            }
        ];
    }

    async onCommand(username, message, channel = 'gc') {
        try {
            const args = this.getArgs(message);

            const playerUsername = username;
            const mob = args[1];
            username = args[0] || username;

            const data = await getLatestProfile(username);

            username = formatUsername(username, data.profileData?.game_mode);

            const bestiary = getBestiary(data.profile);
            if (bestiary === null) {
                return this.send(`/${channel} This player has not yet joined SkyBlock since the bestiary update.`);
            }

            if (mob) {
                const allMobs = this.getBestiaryObject(bestiary);

                // Debug: Show all mob names that contain "worm" to see what's available
                const wormMobs = allMobs.filter((m) =>
                    m.name.toLowerCase().includes('worm')
                );

                if (wormMobs.length > 0) {
                    console.log(`Available worm-related mobs for ${username}:`, wormMobs.map(m => `"${m.name}"`));
                }

                // Only look for exact match (case insensitive)
                const mobData = allMobs.find((m) =>
                    m.name.toLowerCase() === mob.toLowerCase()
                );

                if (mobData) {
                    const isMaxed = mobData.nextTierKills == null;
                    const displayText = isMaxed
                        ? `${mobData.kills} (MAXED)`
                        : `${mobData.kills} / ${mobData.nextTierKills} (${mobData.nextTierKills - mobData.kills})`;

                    this.send(
                        `/${channel} ${username}'s ${mobData.name} Bestiary: ${displayText}`
                    );

                    await new Promise((resolve) => setTimeout(resolve, 1000));
                } else {
                    // Show available worm-related mobs if searching for "worm"
                    if (mob.toLowerCase() === 'worm' && wormMobs.length > 0) {
                        const mobNames = wormMobs.map(m => m.name).join(', ');
                        this.send(`/${channel} No exact match for "worm". Available: ${mobNames}`);
                    } else {
                        this.send(`/${channel} No exact match found for "${mob}".`);
                    }
                    return;
                }
            }

            this.send(
                `/${channel} ${username}'s Bestiary Milestone: ${bestiary.milestone} / ${bestiary.maxMilestone} | Unlocked Tiers: ${bestiary.tiersUnlocked} / ${bestiary.totalTiers}`
            );

            if (playerUsername === username) {
                const bestiaryData = this.getBestiaryObject(bestiary).sort(
                    (a, b) => a.nextTierKills - a.kills - (b.nextTierKills - b.kills)
                );

                const topFive = bestiaryData.slice(0, 5);
                const topFiveMobs = topFive.map((mob) => {
                    return `${mob.name}: ${mob.kills} / ${mob.nextTierKills} (${mob.nextTierKills - mob.kills})`;
                });

                await new Promise((resolve) => setTimeout(resolve, 1000));

                this.send(`/${channel} Closest to level up: ${topFiveMobs.join(', ')}`);
            }
        } catch (error) {
            Logger.warnMessage(error);
            this.send(`/${channel} [ERROR] ${error}`);
        }
    }

    getBestiaryObject(bestiary) {
        return Object.keys(bestiary.categories)
            .map((category) => {
                if (category === 'fishing') {
                    return Object.keys(bestiary.categories[category])
                        .map((key) => {
                            if (key === 'name') return null;
                            return bestiary.categories[category][key].mobs?.map((mob) => mob) || [];
                        })
                        .filter(Boolean)
                        .flat();
                } else {
                    return bestiary.categories[category].mobs?.map((mob) => mob) || [];
                }
            })
            .flat()
            .filter((mob) => mob?.kills != null);
    }
}

module.exports = BestiaryCommand;
