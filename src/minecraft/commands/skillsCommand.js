const minecraftCommand = require('../../contracts/minecraftCommand.js');
const { getLatestProfile } = require('../../../API/functions/getLatestProfile.js');
const getSkills = require('../../../API/stats/skills.js');
const { getUUID } = require('../../contracts/API/PlayerDBAPI.js');
const hypixel = require('../../contracts/API/HypixelRebornAPI.js');
const { formatUsername } = require('../../contracts/helperFunctions.js');

class SkillsCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'skills';
        this.aliases = ['skill', 'sa'];
        this.description = 'Skills and Skill Average of specified user.';
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
            const hypixel_data = await hypixel.getPlayer(uuid);
            const achievements = hypixel_data?.achievements;

            username = formatUsername(username, data.profileData.cute_name);

            const profile = getSkills(data.profile);

            let sa_points = 0;
            let sa_skills = 0;

            const skillsFormatted = Object.keys(profile)
                .map((skill) => {
                    let skill_cap = 100;

                    if (skill == 'farming') {
                        let farming_info = data.profile?.jacob2?.perks?.farming_level_cap;
                        if (farming_info == undefined) {
                            skill_cap = 50;
                        } else {
                            skill_cap = 50 + farming_info;
                        }
                    }

                    if (skill == 'taming') {
                        let taming_cap = (data.v2.profile?.pets_data?.pet_care?.pet_types_sacrificed ?? []).length + 50;
                        if (taming_cap == undefined) {
                            skill_cap = 50;
                        } else {
                            skill_cap = taming_cap;
                        }
                    }

                    const level = Math.min(Math.floor(profile[skill].levelWithProgress ?? 0), skill_cap);

                    if (skill != 'runecrafting' && skill != 'social') {
                        sa_points += level;
                        sa_skills++;
                    }

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

module.exports = SkillsCommand;
