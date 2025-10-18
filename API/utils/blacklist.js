const config = require('#root/config.js').getConfig();
const sbuHelper = require('../../src/api/sbuHelper.js');

async function checkBlacklist(uuid) {
    if (config.API.banlist.enabled === false) {
        return false;
    }

    const response = await sbuHelper.safeApiCall(`/api/banlist/${uuid}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${config.API.SBU.key}`
        }
    });

    return response?.data?.banned === true;
}

module.exports = {
    checkBlacklist
};