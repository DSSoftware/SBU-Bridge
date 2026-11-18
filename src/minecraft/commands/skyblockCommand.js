const { formatNumber, formatUsername } = require('../../contracts/helperFunctions.js');
const { getLatestProfile } = require('../../../API/functions/getLatestProfile.js');
const minecraftCommand = require('../../contracts/minecraftCommand.js');
const { ProfileNetworthCalculator  } = require('skyhelper-networth');
const getTalismans = require('../../../API/stats/talismans.js');
const getDungeons = require('../../../API/stats/dungeons.js');
const getSkills = require('../../../API/stats/skills.js');
const getSlayer = require('../../../API/stats/slayer.js');
const axios = require('axios');
const Logger = require('#root/src/Logger.js');

// Returns N/A on any failure cause external
async function getFarmingWeight(uuid) {
    try {
        const res = await axios.get(`https://api.elitebot.dev/Weight/${uuid}`);
        const profiles = res?.data?.profiles ?? [];

        let weight = 0;
        for (const profile of profiles) {
            const profileWeight = profile?.totalWeight ?? 0;
            if (profileWeight >= weight) {
                weight = profileWeight;
            }
        }

        return weight.toFixed(2);
    } catch (error) {
        Logger.warnMessage(error);
        return 'N/A';
    }
}

// Returns N/A on any failure cause external
async function getMiningWeight(username) {
    try {
        const res = await axios.get(`https://ninjune.dev/api/coleweight?username=${username}`);

        if (res?.data?.name == undefined) {
            return 'N/A';
        }

        return res.data.coleweight;
    } catch (error) {
        Logger.warnMessage(error);
        return 'N/A';
    }
}

class SkyblockCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'skyblock';
        this.aliases = ['stats', 'sb'];
        this.description = 'Skyblock Stats of specified user.';
        this.options = [
            {
                name: 'username',
                description: 'Minecraft username',
                required: false
            }
        ];
    }

    async onCommand(username, message, channel = 'gc') {
        try {
            username = this.getArgs(message)[0] || username;

            const data = await getLatestProfile(username, { museum: true });
            const rawUsername = username;
            username = formatUsername(username, data.profileData.game_mode);

            let personal_bank = data?.v2?.profile?.profile?.bank_account;
            let coop_bank = data.profileData?.banking?.balance || 0;
            let coins_total = coop_bank + (personal_bank || 0);

            const networthManager = new ProfileNetworthCalculator(data.profile, data.museum, coins_total);

            const [skills, slayer, networth, farmingWeight, miningWeight, dungeons, talismans] = await Promise.all([
                getSkills(data.profile),
                getSlayer(data.profile),
                networthManager.getNetworth(),
                getFarmingWeight(data.uuid),
                getMiningWeight(rawUsername),
                getDungeons(data.profile, data.v2.profile),
                getTalismans(data.profile)
            ]);
            const skillAverage = (
                Object.keys(skills)
                    .filter((skill) => !['runecrafting', 'social', 'hunting'].includes(skill))
                    .map((skill) => skills[skill].level)
                    .reduce((a, b) => a + b, 0) /
                (Object.keys(skills).length - 2)
            ).toFixed(1);
            const slayerXp = Object.values(slayer)
                .map((slayerData) => slayerData.xp)
                .reduce((a, b) => a + b, 0)
                .toLocaleString();
            const catacombsLevel = dungeons.catacombs.skill.level;
            const classAverage =
                Object.values(dungeons.classes)
                    .map((value) => value.level)
                    .reduce((a, b) => a + b, 0) / Object.keys(dungeons.classes).length;
            const networthValue = formatNumber(networth.networth);
            const talismanCount = talismans?.total ?? 0;
            const recombobulatedCount = talismans?.recombed ?? 0;
            const enrichmentCount = talismans?.enriched ?? 0;

            this.send(
                `/${channel} ${username}'s Level: ${
                    data.profile.leveling?.experience ? data.profile.leveling.experience / 100 : 0
                } | Mining Weight: ${miningWeight} | Farming Weight: ${farmingWeight} | Skill Average: ${skillAverage} | Slayer: ${slayerXp} | Catacombs: ${catacombsLevel} | Class Average: ${classAverage} | Networth: ${networthValue} | Accessories: ${talismanCount} | Recombobulated: ${recombobulatedCount} | Enriched: ${enrichmentCount}`
            );
        } catch (error) {
            this.send(`/${channel} [ERROR] ${error}`);
        }
    }
}

module.exports = SkyblockCommand;
