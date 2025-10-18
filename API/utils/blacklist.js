const config = require('#root/config.js').getConfig();
const axios = require('axios');
const Logger = require('../../src/Logger');

async function checkBlacklist(uuid) {
    return new Promise(async (resolve) => {
        try {
            if (config.API.banlist.enabled === false) {
                resolve(false);
                return;
            }

            const API_URL = `${config.API.banlist.URL}/${uuid}`;
            const response = await axios.get(API_URL, {
                headers: {
                    'Content-type': 'application/json',
                    Authorization: `Bearer ${config.API.SBU.key}`
                }
            });

            resolve(response.data?.banned === true);
        } catch (error) {
            if (error.response?.status !== 404) {
                // Log error only if it's not a 404 (user not found)
                Logger.warnMessage(`Error checking blacklist for ${uuid}: ${error.message}`);
            }
            resolve(false);
        }
    });
}

module.exports = {
    checkBlacklist
};