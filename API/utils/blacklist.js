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

        // Log the entire response object for debugging
        console.log(`SBU Banlist response for ${uuid}: ${JSON.stringify(response)}`);

        // The response itself is the data object, not nested under a 'data' property.
        if (response) {
            // Return true if banned, otherwise false.
            return response.banned === true;
        }

        return false;
    } catch (error) {
        // This catch block is likely not reached because safeApiCall handles errors.
        // However, it's safe to keep it for unexpected issues.
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