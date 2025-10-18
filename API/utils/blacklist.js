const config = require('#root/config.js').getConfig();
const sbuHelper = require('../../src/api/sbuHelper.js');
const Logger = require('../../src/Logger');

async function checkBlacklist(uuid) {
    if (config.API.banlist.enabled === false) {
        return false;
    }

    try {
        const response = await sbuHelper.safeApiCall(`/api/banlist/${uuid}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${config.API.SBU.key}`
            }
        });

        if (response?.data) {
            console.log(`SBU Banlist response for ${uuid}: ${JSON.stringify(response.data)}`);
            // Return true if banned, otherwise false.
            return response.data?.banned === true;
        }

        return false;
    } catch (error) {
        // A 404 is expected for users who are not banned.
        if (error.response?.status !== 404) {
            Logger.warnMessage(`SBU Banlist check for ${uuid} failed!`);
            Logger.warnMessage(error);
        }
        return false;
    }
}

module.exports = {
    checkBlacklist
};