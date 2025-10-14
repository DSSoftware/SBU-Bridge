const config = require('#root/config.js').getConfig();
const Logger = require('../../src/Logger.js');
const axios = require('axios');

const key = config.API.skykingsAPIkey;

async function lookupUUID(uuid) {
    return new Promise(async (resolve, reject) => {
        if (config.API.banlist.skykings === false) {
            resolve(false);
            return;
        }
        try {
            const response = await axios.get(`https://api.skykings.net/user/lookup`, {
                params: {
                    uuid: uuid
                },
                headers: {
                    'x-api-key': key
                }
            });
            // Check if the API call was successful and if the user is flagged as a scammer
            resolve(response.data?.success === true && response.data?.result?.scammer === true);
        } catch (error) {
            Logger.warnMessage(error);
            resolve(false);
        }
    });
}

module.exports = {
    lookupUUID
};
