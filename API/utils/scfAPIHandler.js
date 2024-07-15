const Logger = require('../../src/Logger');
const config = require('../../config.js');
const axios = require('axios');

const status = {
    Link: {
        status: false,
        disableCounter: 0,
        updated: 0
    },
    Bridgelock: {
        status: false,
        disableCounter: 0,
        updated: 0
    },
    Longpoll: {
        status: false,
        disableCounter: 0,
        updated: 0
    },
    Blacklist: {
        status: false,
        disableCounter: 0,
        updated: 0
    },
    Status: {
        status: false,
        disableCounter: 0,
        updated: 0
    },
    Score: {
        status: false,
        disableCounter: 0,
        updated: 0
    },
    Mojang: {
        status: false,
        disableCounter: 0,
        updated: 0
    }
};

function disableFeature(feature) {
    let disable_ctr = (status?.[feature].disableCounter ?? 0) + 1;
    let disable_updated = Date.now();
    let permanent_disable = false;

    Logger.warnMessage(`[FEATURES] Disabled feature ${feature} (Disable #${disable_ctr}).`);

    if(disable_ctr >= 10){
        Logger.errorMessage(`[FEATURES] Permanently disabled feature ${feature} (Disable #${disable_ctr}).`);
        disable_updated += 7 * 24 * 60 * 60 * 1000;
    }

    status[feature] = {
        status: false,
        disableCounter: disable_ctr,
        updated: disable_updated
    };

    if(!permanent_disable){
        process.send({
            event_id: 'exceptionCaught',
            exception: 'Service Permanently Disabled',
            stack: `Permanently disabled service ${feature} due to health check. (Disable #${disable_ctr})`
        });
        return;
    }

    process.send({
        event_id: 'exceptionCaught',
        exception: 'Service Disabled',
        stack: `Disabled service ${feature} due to health check. (Disable #${disable_ctr})`
    });
}

function enableFeature(feature) {
    Logger.warnMessage(`[FEATURES] Enabled feature ${feature}.`);
    status[feature] = {
        status: true,
        disableCounter: 0,
        updated: Date.now()
    };
}

function getFeatureStatus(feature) {
    const data = status?.[feature];
    if (data.status) {
        return 'OPERATIONAL';
    }
    if (data.updated + 5*60*60*1000*(data.disableCounter+1) > Date.now()) {
        let status = config.behavior?.[feature] ?? 'REPLACE';
        if (status == 'FATAL') {
            Logger.errorMessage(`[FEATURE] Critical component - ${feature} - is down. Will disable the bridge.`);
            process.exit(123);
        }
        return status;
    }
    enableFeature(feature);
    return 'OPERATIONAL';
}

async function SCFCheckBlacklist(uuid) {
    return new Promise(async (resolve, reject) => {
        if (!config.minecraft.API.SCF.enabled) {
            resolve(false);
            return;
        }

        let isBanned = false;

        if (getFeatureStatus('Blacklist') == 'OPERATIONAL') {
            let player_banned = await Promise.all([
                axios.get(
                    `${config.minecraft.API.SCF.provider}?method=isBanned&uuid=${uuid}&api=${config.minecraft.API.SCF.key}`
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

async function SCFgetUUID(username) {
    return new Promise(async (resolve, reject) => {
        let data = null;

        if (getFeatureStatus('Mojang') == 'OPERATIONAL') {
            try {
                data = (await axios.get(`https://mojang.dssoftware.ru/?nick=${username}`)).data;

                if (data?.success == true && data?.id != null) {
                    resolve(data);
                    return;
                }
            } catch (e) {
                if ((e?.response?.status ?? '').toString().startsWith('5')) {
                    disableFeature('Mojang');
                } else {
                    reject('Invalid username.');
                    return;
                }
            }
        }

        try{
            data = await axios.get(`https://api.minecraftservices.com/minecraft/profile/lookup/name/${username}`);

            resolve(data?.data);
        }
        catch(e){
            reject('Invalid username.');
            return;
        }
    });
}

async function SCFCheckBridgelock(uuid) {
    return new Promise(async (resolve, reject) => {
        if (!config.minecraft.API.SCF.enabled) {
            resolve(false);
            return;
        }

        let isLocked = false;

        if (getFeatureStatus('Bridgelock') == 'OPERATIONAL') {
            let player_banned = await Promise.all([
                axios.get(
                    `${config.minecraft.API.SCF.provider}?method=isBridgeLocked&uuid=${uuid}&api=${config.minecraft.API.SCF.key}`
                )
            ]).catch((error) => {
                disableFeature('Bridgelock');
                resolve(false);
            });

            player_banned = player_banned?.[0]?.data ?? {};
            isLocked = player_banned?.data?.locked === true;
        }

        resolve(isLocked);
    });
}

async function SCFgetLinked(discord_id) {
    return new Promise(async (resolve, reject) => {
        let response = undefined;

        if (getFeatureStatus('Link') == 'OPERATIONAL') {
            let player_info = await Promise.all([
                axios.get(
                    `${config.minecraft.API.SCF.provider}?method=getLinked&discord_id=${discord_id}&api=${config.minecraft.API.SCF.key}`
                )
            ]).catch((error) => {
                disableFeature('Link');
                reject("Failed to obtain API response.");
            });

            player_info = player_info?.[0]?.data ?? {};
            response = player_info;
        }
        else{
            reject("Failed to obtain API response.");
            return;
        }

        resolve(response);
    });
}

async function SCFsaveMessage(source, nick, uuid, guild) {
    return new Promise(async (resolve, reject) => {
        if (uuid == undefined) {
            resolve(false);
            return;
        }

        if (getFeatureStatus('Score') == 'OPERATIONAL') {
            let message_send = await Promise.all([
                axios.get(
                    `${config.minecraft.API.SCF.provider}?method=saveGuildMessage&uuid=${uuid}&source=${source}&api=${config.minecraft.API.SCF.key}&nick=${nick}&guild_id=${guild}`
                )
            ]).catch((error) => {
                disableFeature('Score');
            });
        }

        resolve(true);
    });
}

module.exports = {
    status: status,
    checkBlacklist: SCFCheckBlacklist,
    checkBridgelock: SCFCheckBridgelock,
    getUUID: SCFgetUUID,
    getLinked: SCFgetLinked,
    saveMessage: SCFsaveMessage
};
