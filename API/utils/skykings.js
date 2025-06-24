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
            const response = await axios.get(`https://old.skykings.net/api/lookup?key=${key}&uuid=${uuid}`);
            resolve(response.data.entries.length > 0);
        } catch (error) {
            Logger.warnMessage(error);
            resolve(false);
        }
    });
}

module.exports = {
    lookupUUID
};
