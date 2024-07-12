import Logger from '../../src/Logger';
const config = require('../../config.js');
const axios = require('axios');

const status = {
    Link: {
        status: false,
        updated: 0
    },
    Bridgelock: {
        status: false,
        updated: 0
    },
    Longpoll: {
        status: false,
        updated: 0
    },
    Blacklist: {
        status: false,
        updated: 0
    },
    Status: {
        status: false,
        updated: 0
    },
    Score: {
        status: false,
        updated: 0
    },
    Mojang: {
        status: false,
        updated: 0
    }
};

function disableFeature(feature) {
    Logger.warnMessage(`[FEATURES] Disabled feature ${feature}.`);
    status[feature] = {
        status: false,
        updated: Date.now()
    };

    process.send({
        event_id: 'exceptionCaught',
        exception: "Service disabled",
        stack: `Disabled service ${feature} due to health check.`
    });
}

function enableFeature(feature){
    Logger.warnMessage(`[FEATURES] Enabled feature ${feature}.`);
    status[feature] = {
        status: true,
        updated: Date.now()
    };
}

function getFeatureStatus(feature){
    const data = status?.[feature];
    if(data.status){
        return 'OPERATIONAL';
    }
    if (data.updated + 600000 > Date.now()) {
        let status = config.behavior?.[feature] ?? "REPLACE";
        if(status == "FATAL"){
            Logger.errorMessage(`[FEATURE] Critical component - ${feature} - is down. Will disable the bridge.`);
            process.exit(123);
        }
        return status;
    }
    enableFeature(feature);
    return 'OPERATIONAL';
}

async function SCFCheckBlacklist(uuid){
    return new Promise(async (resolve, reject) => {
        if (!config.minecraft.API.SCF.enabled) {
            resolve(false);
            return;
        }

        let isBanned = false;

        if(getFeatureStatus('Blacklist') == "OPERATIONAL"){
            let player_banned = await Promise.all([
                axios.get(
                    `https://sky.dssoftware.ru/api.php?method=isBanned&uuid=${uuid}&api=${config.minecraft.API.SCF.key}`
                )
            ]).catch((error) => {
                disableFeature('Blacklist');
                resolve(false);
            });
            player_banned = player_banned?.[0]?.data ?? {};
            isBanned = player_banned.data === true;
        }

        resolve(isBanned);
    });
}

module.exports = {
    status: status,
    checkBlacklist: SCFCheckBlacklist
};
