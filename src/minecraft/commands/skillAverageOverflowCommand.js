const minecraftCommand = require('../../contracts/minecraftCommand.js');
const { formatUsername } = require('../../contracts/helperFunctions.js');
const { getLatestProfile } = require('../../../API/functions/getLatestProfile.js');
const { getUUID } = require('../../contracts/API/PlayerDBAPI.js');
const getSkills = require('../../../API/stats/skills.js');

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

            const profile = getSkills(data.profile);

            let total_xp = 0;
            let xp_skills = 0;
            const skillsWithXp = [];

            Object.keys(profile).forEach((skill) => {
                const totalXp = profile[skill].totalXp ?? 0;

                if (skill != 'runecrafting' && skill != 'social') {
                    total_xp += totalXp;
                    xp_skills++;

                    if (totalXp > 0) {
                        const skillName = skill[0].toUpperCase() + skill.slice(1);
                        skillsWithXp.push(`${skillName} ${totalXp.toLocaleString()}`);
                    }
                }
            });

            const skillsFormatted = skillsWithXp.length > 0 ? skillsWithXp.join(' | ') : 'No XP';

            let skillAverageXp = 'N/A';

            if (xp_skills != 0) {
                skillAverageXp = Math.floor(total_xp / xp_skills).toLocaleString();
            }

            this.send(`/${channel} ${username}'s Skill Average XP: ${skillAverageXp ?? 0} (${skillsFormatted})`);
        } catch (error) {
            this.send(`/${channel} [ERROR] ${error}`);
        }
    }
}

module.exports = SkillAverageOverflowCommand;