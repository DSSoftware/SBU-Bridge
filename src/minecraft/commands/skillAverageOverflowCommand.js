const minecraftCommand = require('../../contracts/minecraftCommand.js');
const { formatUsername, formatNumber } = require('../../contracts/helperFunctions.js');
const { getLatestProfile } = require('../../../API/functions/getLatestProfile.js');
const { getUUID } = require('../../contracts/API/PlayerDBAPI.js');
const getSkills = require('../../../API/stats/skills.js');
const xp_tables = require('../../../API/constants/xp_tables.js');

class SkillAverageOverflowCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'skillAverageOverflow';
        this.aliases = ['sao'];
        this.description = 'Skill Average Overflow of specified user.';
        this.options = [
            {
                name: 'username',
                description: 'Minecraft username',
                required: false
            }
        ];
    }

    getMaxXp(skill) {
        let table = 'normal';
        if (skill === 'runecrafting') table = 'runecrafting';
        if (skill === 'social') table = 'social';
        if (skill === 'dungeoneering') table = 'catacombs';

        let maxXp = 0;
        const maxLevel = xp_tables.max_levels[skill] || 60;

        for (let i = 0; i < maxLevel; i++) {
            maxXp += xp_tables[table][i];
        }

        return maxXp;
    }

    async onCommand(username, message, channel = 'gc') {
        try {
            username = this.getArgs(message)[0] || username;

            const uuid = await getUUID(username);

            const data = await getLatestProfile(uuid);

            username = formatUsername(username, data.profileData.cute_name);

            const profile = getSkills(data.profile);

            const skillsFormatted = Object.keys(profile)
                .filter((skill) => skill !== 'runecrafting' && skill !== 'social' && skill !== 'dungeoneering')
                .map((skill) => {
                    const totalXp = profile[skill].totalXp;
                    const maxXp = this.getMaxXp(skill);
                    const overflow = Math.max(0, totalXp - maxXp);

                    let table = 'normal';
                    if (skill === 'runecrafting') table = 'runecrafting';
                    if (skill === 'social') table = 'social';
                    if (skill === 'dungeoneering') table = 'catacombs';

                    const nextLevelXp = xp_tables[table][xp_tables.max_levels[skill]] || 7000000;
                    const overflowLevel = overflow > 0 ? (overflow / nextLevelXp).toFixed(2) : '(not max)';

                    const skillName = skill[0].toUpperCase() + skill.slice(1);
                    return `${skillName} ${overflowLevel}`;
                })
                .join(' | ');

            this.send(`/${channel} ${username}'s Skill Overflow: (${skillsFormatted})`);
        } catch (error) {
            this.send(`/${channel} [ERROR] ${error}}`);
        }
    }
}

module.exports = SkillAverageOverflowCommand;