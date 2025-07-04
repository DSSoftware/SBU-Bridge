const config = require('#root/config.js').getConfig();
const axios = require('axios');

async function checkBlacklist(uuid) {
    return new Promise(async (resolve, reject) => {
        try {
            if (config.API.banlist.enabled === false) {
                resolve(false);
                return;
            }
            const API_URL = config.API.banlist.URL;

            await axios.get(API_URL, {
                headers: {
                    'Content-type': 'application/json'
                }
            });

            let blacklisted = false;

            axios
                .get(API_URL + `?uuid=${uuid}`)
                .then(function (response) {
                    if (response.data.banned) {
                        blacklisted = true;
                    }
                    resolve(blacklisted);
                })
                .catch(function (error) {
                    blacklisted = true;
                    resolve(blacklisted);
                });
        } catch (e) {
            resolve(false);
        }
    });
}

module.exports = {
    checkBlacklist
};
