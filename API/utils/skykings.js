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

module.exports = {
    lookupUUID
};
