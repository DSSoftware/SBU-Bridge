//CREDIT: https://github.com/SkyCrypt/SkyCryptWebsite (Modified)
const xp_tables = require('./xp_tables.js');

module.exports = function calcSkill(skill, experience, profile=false) {
    let table = 'normal';
    if (skill === 'runecrafting') table = 'runecrafting';
    if (skill === 'social') table = 'social';
    if (skill === 'dungeoneering') table = 'catacombs';
    let skill_cap = 100;

    if(profile){
        if (skill === 'farming') {
            let farming_info = profile?.jacobs_contest?.perks?.farming_level_cap;
            if (farming_info == undefined) {
                skill_cap = 50;
            } else {
                skill_cap = 50 + farming_info;
            }
        }

        if (skill == 'taming') {
            let taming_cap = (profile?.pets_data?.pet_care?.pet_types_sacrificed ?? []).length + 50;
            if (taming_cap == undefined) {
                skill_cap = 50;
            } else {
                skill_cap = taming_cap;
            }
        }
    }

    if (experience <= 0) {
        return {
            totalXp: 0,
            xp: 0,
            level: 0,
            xpCurrent: 0,
            xpForNext: xp_tables[table][0],
            progress: 0
        };
    }
    let xp = 0;
    let level = 0;
    let xpForNext = 0;
    let progress = 0;
    let maxLevel = 0;

    if (xp_tables.max_levels[skill]) maxLevel = xp_tables.max_levels[skill];

    for (let i = 1; i <= maxLevel; i++) {
        xp += xp_tables[table][i - 1];

        if (xp > experience) {
            xp -= xp_tables[table][i - 1];
        } else {
            if (i <= maxLevel) level = i;
        }
    }

    if (skill === 'dungeoneering') {
        level += Math.floor((experience - xp) / 200_000_000);
        xp += Math.floor((experience - xp) / 200_000_000) * 200_000_000;

        xpForNext = 200000000;
    }

    const xpCurrent = Math.floor(experience - xp);

    const totalXp = experience;

    if (level < maxLevel) {
        xpForNext = Math.ceil(xp_tables[table][level] || 200000000);
    }

    progress = level >= maxLevel && skill !== 'dungeoneering' ? 0 : Math.max(0, Math.min(xpCurrent / xpForNext, 1));

    //const level = Math.min(Math.floor(profile[skill].levelWithProgress ?? 0), skill_cap);

    level = Math.min(level, skill_cap);
    levelWithProgress = Math.min(level + progress || 0, skill_cap);

    return {
        totalXp,
        xp,
        level,
        xpCurrent,
        xpForNext,
        progress,
        levelWithProgress: levelWithProgress
    };
};
