const config = require('#root/config.js').getConfig();
const SCFAPI = require("./scfAPIHandler.js");
const axios = require('axios');

const sender_cache = new Map();

async function checkBridgelock(uuid) {
    return new Promise(async (resolve, reject) => {
        if (sender_cache.has(uuid)) {
            const data = sender_cache.get(uuid);

            if (data.last_save + 60000 > Date.now()) {
                resolve(data.locked);
                return;
            }
        }

        SCFAPI.checkBridgelock(uuid).then(
            (response) => {
                sender_cache.set(uuid, {
                    last_save: Date.now(),
                    locked: response
                });

                resolve(response);
            },
            () => {
                resolve(false);
            }
        );
    });
}

module.exports = {
    checkBridgelock
};
