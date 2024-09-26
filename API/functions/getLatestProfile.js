const { getMuseum } = require('./getMuseum.js');
const { isUuid } = require('../utils/uuid.js');
const config = require('../../config.js');
const axios = require('axios');
const { getUUID } = require('../../src/contracts/API/PlayerDBAPI.js');

const cache = new Map();

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

    const [{ data: profileResv2 }] = await Promise.all([
        axios.get(`https://api.hypixel.net/v2/skyblock/profiles?key=${config.minecraft.API.hypixelAPIkey}&uuid=${uuid}`)
    ]).catch((error) => {
        throw error?.response?.data?.cause ?? 'Request to Hypixel API failed. Please try again!';
    });

    if (
        profileResv2.profiles == null ||
        profileResv2.profiles.length == 0
    ) {
        throw 'Player has no SkyBlock profiles.';
    }

    const profileDatav2 = profileResv2.profiles.find((a) => a.selected) || null;
    if (profileDatav2 == null) {
        throw 'Player does not have selected profile.';
    }

    const profilev2 = profileDatav2.members[uuid];
    if (profilev2 == null) {
        throw 'Uh oh, this player is not in this Skyblock profile.';
    }

    // Remapping new points to old system
    profilev2.coin_purse = profilev2?.currencies?.coin_purse;

    profilev2.inv_armor = profilev2?.inventory?.inv_armor;
    profilev2.equipment_contents = profilev2?.inventory?.equipment_contents;
    profilev2.wardrobe_contents = profilev2?.inventory?.wardrobe_contents;
    profilev2.inv_contents = profilev2?.inventory?.inv_contents;
    profilev2.ender_chest_contents = profilev2?.inventory?.ender_chest_contents;
    profilev2.personal_vault_contents = profilev2?.inventory?.personal_vault_contents;

    profilev2.backpack_icons = profilev2?.inventory?.backpack_icons;
    profilev2.backpack_contents = profilev2?.inventory?.backpack_contents;

    profilev2.talisman_bag = profilev2?.inventory?.bag_contents?.talisman_bag;
    profilev2.fishing_bag = profilev2?.inventory?.bag_contents?.fishing_bag;
    profilev2.potion_bag = profilev2?.inventory?.bag_contents?.potion_bag;
    profilev2.sacks_bag = profilev2?.inventory?.bag_contents?.sacks_bag;
    
    profilev2.candy_inventory_contents = profilev2?.shared_inventory?.candy_inventory_contents;
    profilev2.carnival_mask_inventory_contents = profilev2?.shared_inventory?.carnival_mask_inventory_contents;

    const output = {
        last_save: Date.now(),
        v2: {
            profiles: profileResv2.profiles,
            profile: profilev2,
            profileData: profileDatav2
        },
        profiles: profileResv2.profiles,
        profile: profilev2,
        profileData: profileDatav2,
        uuid: uuid,
        ...(options.museum ? await getMuseum(profileDatav2.profile_id, uuid) : {})
    };

    cache.set(uuid, output);

    return output;
}

module.exports = { getLatestProfile };
