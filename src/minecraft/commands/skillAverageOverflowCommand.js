const minecraftCommand = require('../../contracts/minecraftCommand.js');
const { formatUsername } = require('../../contracts/helperFunctions.js');
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

    async onCommand(username, message, channel = 'gc') {
        try {
            username = this.getArgs(message)[0] || username;

            const uuid = await getUUID(username);

            const data = await getLatestProfile(uuid);

            username = formatUsername(username, data.profileData.cute_name);

            const profile = data.profile;
            const skillsData = getSkills(profile);

            let overflow_xp = 0;
            let overflow_skills = 0;
            const skillsList = [];

            Object.keys(skillsData).forEach((skill) => {
                // Skip runecrafting and social
                if (skill === 'runecrafting' || skill === 'social') {
                    return;
                }

                const experienceKey = `experience_skill_${skill}`;
                const experience = profile[experienceKey] || 0;

                let table = 'normal';
                if (skill === 'runecrafting') table = 'runecrafting';
                if (skill === 'social') table = 'social';
                if (skill === 'dungeoneering') table = 'catacombs';

                let maxLevel = xp_tables.max_levels[skill] || 60;
                let totalXpForMaxLevel = 0;

                // Calculate total XP needed to reach max level
                for (let i = 0; i < maxLevel; i++) {
                    totalXpForMaxLevel += xp_tables[table][i];
                }

                // Calculate overflow XP
                if (experience > totalXpForMaxLevel) {
                    const overflowXpAmount = experience - totalXpForMaxLevel;
                    overflow_xp += overflowXpAmount;
                    overflow_skills++;

                    const skillName = skill[0].toUpperCase() + skill.slice(1);
                    skillsList.push(`${skillName} +${overflowXpAmount.toLocaleString()}`);
                }
            });

            const skillsFormatted = skillsList.length > 0 ? skillsList.join(' | ') : 'No overflow';

            let skillAverageOverflow = 'N/A';

            if (overflow_skills !== 0) {
                skillAverageOverflow = Math.floor(overflow_xp / overflow_skills).toLocaleString();
            }

            this.send(`/${channel} ${username}'s Skill Average Overflow: +${skillAverageOverflow ?? 0} XP (${skillsFormatted})`);
        } catch (error) {
            this.send(`/${channel} [ERROR] ${error}`);
        }
    }
}

module.exports = SkillAverageOverflowCommand;