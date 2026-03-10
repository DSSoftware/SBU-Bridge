const config = require('#root/config.js').getConfig();
const { getUUID } = require('../../contracts/API/PlayerDBAPI.js');
const { hypixelRequest } = require('../../../API/utils/scfAPIHandler.js');
const { CROP_IDS_MAP } = require('../../../API/constants/garden.js');

async function resolveGardenContext(targetUsername, profileName = null) {
    const uuidResponse = await getUUID(targetUsername, true);
    const targetUuid = uuidResponse?.uuid;

    if (!targetUuid) {
        throw 'Invalid username.';
    }

    const profilesResponse = await hypixelRequest(
        `https://api.hypixel.net/v2/skyblock/profiles?key=${config.API.hypixelAPIkey}&uuid=${targetUuid}`
    );

    const profiles = profilesResponse?.profiles ?? [];
    if (profiles.length === 0) {
        throw 'Player has no SkyBlock profiles.';
    }

    const profileData =
        typeof profileName === 'string' && profileName.trim().length > 0
            ? profiles.find((profile) => (profile?.cute_name ?? '').toLowerCase() === profileName.toLowerCase())
            : profiles.find((profile) => profile?.selected) || profiles[0];

    if (!profileData) {
        throw `Profile not found: ${profileName}`;
    }

    const memberData = profileData?.members?.[targetUuid];
    if (!memberData) {
        throw 'Player is not on the selected profile.';
    }

    const gardenResponse = await hypixelRequest(
        `https://api.hypixel.net/v2/skyblock/garden?key=${config.API.hypixelAPIkey}&profile=${profileData.profile_id}`
    );

    return {
        uuid: targetUuid,
        username: uuidResponse?.username ?? targetUsername,
        profileData,
        memberData,
        gardenData: gardenResponse?.garden ?? {}
    };
}

function parseCropInput(input) {
    if (typeof input !== 'string') {
        return null;
    }

    const normalized = input.trim().toUpperCase().replace(/\s+/g, '_');
    if (normalized.length === 0) {
        return null;
    }

    return CROP_IDS_MAP[normalized] ? normalized : null;
}

function getGardenLevelFromXP(experience) {
    if (typeof experience !== 'number') {
        return 'N/A';
    }

    const levelsXP = [
        [1, 0], [2, 70], [3, 140], [4, 280], [5, 520], [6, 1120], [7, 2620], [8, 4620], [9, 7120], [10, 10120],
        [11, 20120], [12, 30120], [13, 40120], [14, 50120], [15, 60120]
    ];

    let currentLevel = 1;
    for (const [level, threshold] of levelsXP) {
        if (experience >= threshold) {
            currentLevel = level;
        }
    }

    return currentLevel;
}

function formatNumber(value) {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return '0';
    }

    return Number(value).toLocaleString();
}

function normalizeVisitorName(input) {
    if (typeof input !== 'string') {
        return null;
    }

    return input.trim().toUpperCase().replace(/\s+/g, '_');
}

module.exports = {
    resolveGardenContext,
    parseCropInput,
    getGardenLevelFromXP,
    formatNumber,
    normalizeVisitorName
};