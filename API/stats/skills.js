const calcSkill = require('../constants/skills.js');

module.exports = function getSkills(profile) {
    const skill_experience = {
        farming: profile?.player_data?.experience?.SKILL_FARMING || 0,
        mining: profile?.player_data?.experience?.SKILL_MINING || 0,
        combat: profile?.player_data?.experience?.SKILL_COMBAT || 0,
        foraging: profile?.player_data?.experience?.SKILL_FORAGING || 0,
        fishing: profile?.player_data?.experience?.SKILL_FISHING || 0,
        enchanting: profile?.player_data?.experience?.SKILL_ENCHANTING || 0,
        alchemy: profile?.player_data?.experience?.SKILL_ALCHEMY || 0,
        carpentry: profile?.player_data?.experience?.SKILL_CARPENTRY || 0,
        runecrafting: profile?.player_data?.experience?.SKILL_RUNECRAFTING || 0,
        social: profile?.player_data?.experience?.SKILL_SOCIAL || 0,
        taming: profile?.player_data?.experience?.SKILL_TAMING || 0,
    };

    return {
        farming: calcSkill('farming', skill_experience['farming'], profile),
        mining: calcSkill('mining', skill_experience['mining'], profile),
        combat: calcSkill('combat', skill_experience['combat'], profile),
        foraging: calcSkill('foraging', skill_experience['foraging'], profile),
        fishing: calcSkill('fishing', skill_experience['fishing'], profile),
        enchanting: calcSkill('enchanting', skill_experience['enchanting'], profile),
        alchemy: calcSkill('alchemy', skill_experience['alchemy'], profile),
        carpentry: calcSkill('carpentry', skill_experience['carpentry'], profile),
        runecrafting: calcSkill('runecrafting', skill_experience['runecrafting'], profile),
        social: calcSkill('social', skill_experience['social'], profile),
        taming: calcSkill('taming', skill_experience['taming'], profile)
    };
};
