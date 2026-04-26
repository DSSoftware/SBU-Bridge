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

            let overflow_points = 0;
            let overflow_skills = 0;

            const skillsFormatted = Object.keys(profile)
                .map((skill) => {
                    const levelWithProgress = profile[skill].levelWithProgress ?? 0;
                    const level = Math.floor(levelWithProgress);
                    const overflowLevel = levelWithProgress - level;

                    // Only count overflow for skills that aren't runecrafting or social
                    if (skill !== 'runecrafting' && skill !== 'social') {
                        overflow_points += overflowLevel;
                        overflow_skills++;
                    }

                    const skillName = skill[0].toUpperCase() + skill.slice(1);
                    return `${skillName} +${overflowLevel.toFixed(2)}`;
                })
                .join(' | ');

            let skillAverageOverflow = 'N/A';

            if (overflow_skills !== 0) {
                skillAverageOverflow = (overflow_points / overflow_skills).toFixed(2);
            }

            this.send(`/${channel} ${username}'s Skill Average Overflow: +${skillAverageOverflow ?? 0} (${skillsFormatted})`);
        } catch (error) {
            this.send(`/${channel} [ERROR] ${error}`);
        }
    }
}

module.exports = SkillAverageOverflowCommand;