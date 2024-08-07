const { getMuseum } = require('./getMuseum.js');
const { isUuid } = require('../utils/uuid.js');
const config = require('../../config.js');
const axios = require('axios');
const { getUUID } = require('../../src/contracts/API/PlayerDBAPI.js');

const cache = new Map();
const v2cache = new Map();

async function getLatestProfile(uuid, options = { museum: false }) {
    if (!isUuid(uuid)) {
        uuid = await getUUID(uuid).catch((error) => {
            throw error;
        });
    }

    if (cache.has(uuid)) {
        const data = cache.get(uuid);

        if (data.last_save + 300000 > Date.now()) {
            return data;
        }
    }

    const [{ data: profileRes }, { data: profileResv2 }] = await Promise.all([
        axios.get(`https://api.hypixel.net/skyblock/profiles?key=${config.minecraft.API.hypixelAPIkey}&uuid=${uuid}`),
        axios.get(`https://api.hypixel.net/v2/skyblock/profiles?key=${config.minecraft.API.hypixelAPIkey}&uuid=${uuid}`)
    ]).catch((error) => {
        throw error?.response?.data?.cause ?? 'Request to Hypixel API failed. Please try again!';
    });

    if (
        profileRes.profiles == null ||
        profileRes.profiles.length == 0 ||
        profileResv2.profiles == null ||
        profileResv2.profiles.length == 0
    ) {
        throw 'Player has no SkyBlock profiles.';
    }

    const profileData = profileRes.profiles.find((a) => a.selected) || null;
    const profileDatav2 = profileResv2.profiles.find((a) => a.selected) || null;
    if (profileData == null || profileDatav2 == null) {
        throw 'Player does not have selected profile.';
    }

    const profile = profileData.members[uuid];
    const profilev2 = profileDatav2.members[uuid];
    if (profile === null || profilev2 == null) {
        throw 'Uh oh, this player is not in this Skyblock profile.';
    }

    const output = {
        last_save: Date.now(),
        v2: {
            profiles: profileResv2.profiles,
            profile: profilev2,
            profileData: profileDatav2
        },
        profiles: profileRes.profiles,
        profile: profile,
        profileData: profileData,
        uuid: uuid,
        ...(options.museum ? await getMuseum(profileData.profile_id, uuid) : {})
    };

    cache.set(uuid, output);

    return output;
}

module.exports = { getLatestProfile };
