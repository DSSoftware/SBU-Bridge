const minecraftCommand = require('../../contracts/minecraftCommand.js');
const { getLatestProfile } = require('../../../API/functions/getLatestProfile.js');
const { getUUID } = require('../../contracts/API/PlayerDBAPI.js');
const { formatUsername } = require('../../contracts/helperFunctions.js');
const xp_tables = require('../../../API/constants/xp_tables.js');
const Logger = require('#root/src/Logger.js');

const SKILL_ORDER = [
    'farming',
    'mining',
    'combat',
    'foraging',
    'fishing',
    'enchanting',
    'alchemy',
    'carpentry',
    'runecrafting',
    'social',
    'taming',
    'hunting'
];

const XP_KEYS = {
    farming: 'SKILL_FARMING',
    mining: 'SKILL_MINING',
    combat: 'SKILL_COMBAT',
    foraging: 'SKILL_FORAGING',
    fishing: 'SKILL_FISHING',
    enchanting: 'SKILL_ENCHANTING',
    alchemy: 'SKILL_ALCHEMY',
    carpentry: 'SKILL_CARPENTRY',
    runecrafting: 'SKILL_RUNECRAFTING',
    social: 'SKILL_SOCIAL',
    taming: 'SKILL_TAMING',
    hunting: 'SKILL_HUNTING'
};

class SkillsOverflowCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'skillsoverflow';
        this.aliases = ['saof', 'sao'];
        this.description = 'Uncapped skills and uncapped skill average.';
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

            const displayName = formatUsername(username, data.profileData?.game_mode);
            const experience = data?.profile?.player_data?.experience ?? {};

            let saPoints = 0;
            let saSkills = 0;

            const skillsFormatted = SKILL_ORDER.map((skill) => {
                const totalXp = Number(experience?.[XP_KEYS[skill]] || 0);
                const uncapped = calcUncappedSkill(skill, totalXp);
                const level = Math.floor(uncapped.levelWithProgress ?? 0);

                if (skill !== 'runecrafting' && skill !== 'social') {
                    saPoints += level;
                    saSkills++;
                }

                const skillName = skill[0].toUpperCase() + skill.slice(1);
                return `${skillName} ${level}`;
            }).join(' | ');

            const uncappedSkillAverage = saSkills > 0 ? (saPoints / saSkills).toFixed(2) : 'N/A';

            this.send(
                `/${channel} ${displayName}'s Uncapped Skill Average: ${uncappedSkillAverage} (${skillsFormatted})`
            );
        } catch (error) {
            Logger.warnMessage(error);
            this.send(`/${channel} [ERROR] ${error}`);
        }
    }
}

function calcUncappedSkill(skill, experience) {
    const tableName = getSkillTableName(skill);
    const xpTable = xp_tables?.[tableName] ?? xp_tables.normal;
    const tableMaxLevel = Number(xpTable.length);
    const fallbackXpForNext = Number(xpTable[xpTable.length - 1] ?? 1);

    if (!Number.isFinite(experience) || experience <= 0) {
        return {
            totalXp: 0,
            level: 0,
            xpCurrent: 0,
            xpForNext: Number(xpTable[0] ?? fallbackXpForNext),
            progress: 0,
            levelWithProgress: 0
        };
    }

    let xpSpent = 0;
    let level = 0;

    for (let currentLevel = 1; currentLevel <= tableMaxLevel; currentLevel++) {
        const requiredXp = Number(xpTable[currentLevel - 1] ?? fallbackXpForNext);
        if (xpSpent + requiredXp > experience) {
            break;
        }

        xpSpent += requiredXp;
        level = currentLevel;
    }

    const postCapXpForNext = Math.max(1, fallbackXpForNext);
    while (xpSpent + postCapXpForNext <= experience) {
        xpSpent += postCapXpForNext;
        level++;
    }

    const xpForNext = level < tableMaxLevel ? Number(xpTable[level] ?? postCapXpForNext) : postCapXpForNext;

    const xpCurrent = Math.max(0, experience - xpSpent);
    const progress = Math.max(0, Math.min(xpCurrent / xpForNext, 1));
    const levelWithProgress = level + progress;

    return {
        totalXp: experience,
        level,
        xpCurrent,
        xpForNext,
        progress,
        levelWithProgress
    };
}

function getSkillTableName(skill) {
    if (skill === 'runecrafting') {
        return 'runecrafting';
    }

    if (skill === 'social') {
        return 'social';
    }

    return 'normal';
}

module.exports = SkillsOverflowCommand;
