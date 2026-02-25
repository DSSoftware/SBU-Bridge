/* eslint-disable no-throw-literal */
const config = require('#root/config.js').getConfig();
const axios = require('axios');
const { hypixelRequest } = require('../utils/scfAPIHandler.js');

async function getGarden(profileID, uuid) {
    try {
        const data = await hypixelRequest(
            `https://hypixel.dssoftware.ru/v2/skyblock/garden?key=${config.API.hypixelAPIkey}&profile=${profileID}`
        );

        if (data === undefined || data.success === false) {
            throw 'Request to Hypixel API failed. Please try again!';
        }

        if (data.garden === null || Object.keys(data.garden).length === 0) {
            // throw "Profile doesn't have a museum.";
        }

        return {
            garden: data.garden ? data.garden : null,
            gardenData: data.garden ? data.garden : null
        };
    } catch (e) {
        throw new Error(e);
    }
}

module.exports = { getGarden };
