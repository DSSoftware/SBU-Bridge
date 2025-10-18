const config = require('#root/config.js').getConfig();
const sbuHelper = require('../../src/api/sbuHelper.js');

async function checkBlacklist(uuid) {
    if (config.API.banlist.enabled === false) {
        return false;
    }

    const response = await sbuHelper.safeApiCall(`/${uuid}`, {
        method: 'GET'
    });

    return response?.data?.banned === true;
}

module.exports = {
    checkBlacklist
};