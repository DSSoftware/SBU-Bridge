const config = require('#root/config.js').getConfig();
const Logger = require('../../src/Logger.js');
const axios = require('axios');

const key = config.API.skykingsAPIkey;

async function lookupUUID(uuid) {
    if (config.API.banlist.skykings === false) {
        return false;
    }

    try {
        const response = await axios.get(`https://api.skykings.net/user/lookup`, {
            params: {
                uuid: uuid
            },
            headers: {
                Authorization: key
            }
        });

        return response.data?.success === true && response.data?.result?.scammer === true;
    } catch (error) {
        Logger.warnMessage(error?.response?.data ?? error);
        return false;
    }
}

async function getNetworth(profileData, uuid, options = {}) {
    try {
        const response = await axios.post(
            'https://api.skykings.net/networth',
            {
                profile_data: profileData,
                uuid: uuid,
                profile_name: options.profileName,
                top: options.top ?? 25,
                include_bank: options.includeBank ?? true,
                include_all_entries: options.includeAllEntries ?? false
            },
            {
                headers: {
                    Authorization: key
                }
            }
        );

        if (response.data?.success !== true) {
            throw new Error(response.data?.message ?? 'SkyKings networth lookup failed.');
        }
        console.log(response.data.data);
        return response.data.data;
    } catch (error) {
        Logger.warnMessage(error?.response?.data ?? error);
        throw new Error(error?.response?.data?.message ?? error.message ?? 'SkyKings networth lookup failed.');
    }
}

module.exports = {
    lookupUUID,
    getNetworth
};
