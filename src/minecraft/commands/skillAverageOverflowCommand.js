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

            let sa_points = 0;
            let sa_skills = 0;

            const skillsFormatted = Object.keys(profile)
                .filter((skill) => skill !== 'runecrafting' && skill !== 'social' && skill !== 'dungeoneering')
                .map((skill) => {
                    const level = profile[skill].totalXp;

                    sa_points += level;
                    sa_skills++;

                    const skillName = skill[0].toUpperCase() + skill.slice(1);
                    return `${skillName} ${level}`;
                })
                .join(' | ');

            let skillAverage = 'N/A';

            if (sa_skills != 0) {
                skillAverage = (sa_points / sa_skills).toFixed(2);
            }

            this.send(`/${channel} ${username}'s Skill Average: ${skillAverage ?? 0} (${skillsFormatted})`);
        } catch (error) {
            this.send(`/${channel} [ERROR] ${error}}`);
        }
    }
}

module.exports = SkillAverageOverflowCommand;