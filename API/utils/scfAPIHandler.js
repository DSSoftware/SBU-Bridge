const config = require('#root/config.js').getConfig();
const axios = require('axios');

const status = {};

for (const service of Object.keys(config.behavior)) {
    status[service] = {
        status: false,
        errorsCounter: 0,
        disableCounter: 0,
        updated: 0
    };
}

setInterval(
    () => {
        for (const service of Object.keys(status)) {
            if (status[service].errorsCounter != 0) {
                console.log(`Service ${service} had ${status[service].errorsCounter} errors in the past 5 minutes.`);
            }
            status[service].errorsCounter = 0;
        }
    },
    5 * 60 * 1000
);

function disableFeature(feature) {
    status[feature].errorsCounter += 1;

    if (status[feature].errorsCounter < 5 && status[feature].disableCounter == 0) {
        return;
    }

    let disable_ctr = (status?.[feature].disableCounter ?? 0) + 1;
    let disable_updated = Date.now();
    let permanent_disable = false;

    console.log(`[FEATURES] Disabled feature ${feature} (Disable #${disable_ctr}).`);

    if (disable_ctr >= 10) {
        console.log(`[FEATURES] Permanently disabled feature ${feature} (Disable #${disable_ctr}).`);
        disable_updated += 7 * 24 * 60 * 60 * 1000;
        permanent_disable = true;
    }

    status[feature] = {
        status: false,
        errorsCounter: status[feature].errorsCounter,
        disableCounter: disable_ctr,
        updated: disable_updated
    };

    if (permanent_disable) {
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
    console.log(`[FEATURES] Enabled feature ${feature}.`);
    status[feature] = {
        status: true,
        errorsCounter: 0,
        disableCounter: 0,
        updated: Date.now()
    };
}

function getFeatureStatus(feature) {
    const data = status?.[feature];
    if (data.status) {
        return 'OPERATIONAL';
    }
    if (data.updated + 5 * 60 * 1000 * (data.disableCounter + 1) > Date.now()) {
        let status = config.behavior?.[feature] ?? 'REPLACE';
        if (status == 'FATAL') {
            console.log(`[FEATURE] Critical component - ${feature} - is down. Will disable the bridge.`);
            process.exit(123);
        }
        return status;
    }
    enableFeature(feature);
    return 'OPERATIONAL';
}

async function SCFCheckBlacklist(uuid) {
    const require_service = 'Blacklist';
    return new Promise(async (resolve, reject) => {
        if (!config.API.SCF.enabled) {
            resolve(false);
            return;
        }

        let isBanned = false;

        if (getFeatureStatus(require_service) == 'OPERATIONAL') {
            try {
                let response = await config.SCF.API.server.isBlacklisted(uuid);
                isBanned = response.banned;
            } catch (e) {
                console.log(e);
                disableFeature(require_service);
                resolve(false);
                return;
            }
        }

        resolve(isBanned);
    });
}

async function SCFgetUUID(username) {
    const require_service = 'Mojang';
    return new Promise(async (resolve, reject) => {
        let data = null;

        if (getFeatureStatus(require_service) == 'OPERATIONAL') {
            try {
                data = (await axios.get(`${config.API.tools.mojang}?nick=${username}`)).data;

                if (data?.success == true && data?.id != null) {
                    resolve(data);
                    return;
                }
            } catch (e) {
                if ((e?.response?.status ?? '').toString().startsWith('5')) {
                    console.log(e);
                    disableFeature(require_service);
                } else {
                    reject('Invalid username.');
                    return;
                }
            }
        }

        try {
            data = await axios.get(`https://api.minecraftservices.com/minecraft/profile/lookup/name/${username}`);

            resolve(data?.data);
        } catch (e) {
            reject('Invalid username.');
            return;
        }
    });
}

async function SCFgetUsername(uuid) {
    const require_service = 'Mojang';
    return new Promise(async (resolve, reject) => {
        let data = null;

        if (getFeatureStatus(require_service) == 'OPERATIONAL') {
            try {
                data = (await axios.get(`${config.API.tools.mojang}?uuid=${uuid}`)).data;
                resolve(data);
                return;
            } catch (e) {
                console.log(e);
                disableFeature(require_service);
            }
        }

        try {
            data = await axios.get(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`);

            resolve(data?.data);
        } catch (e) {
            resolve({});
        }
    });
}

async function SCFCheckBridgelock(uuid) {
    const require_service = 'Bridgelock';
    return new Promise(async (resolve, reject) => {
        if (!config.API.SCF.enabled) {
            resolve(false);
            return;
        }

        let isLocked = false;

        if (getFeatureStatus(require_service) == 'OPERATIONAL') {
            try{
                let response = await config.SCF.API.bridgelock.check(uuid);
                isLocked = response.locked;
            }
            catch(e){
                console.log(e);
                disableFeature(require_service);
                resolve(false);
                return;
            }
        }

        resolve(isLocked);
    });
}

async function SCFgetLinked(discord_id) {
    const require_service = 'Link';
    return new Promise(async (resolve, reject) => {
        if (getFeatureStatus(require_service) == 'OPERATIONAL') {
            try{
                let response = await config.SCF.API.bridge.getLinked(null, discord_id);
                resolve(response.uuid);
                return;
            }
            catch(e){
                console.log(e);
                disableFeature(require_service);
                reject('Failed to obtain API response.');
                return;
            }
        } else {
            reject('Failed to obtain API response.');
            return;
        }
    });
}

async function SCFsaveMessage(source, nick, uuid, guild) {
    const require_service = 'Score';
    return new Promise(async (resolve, reject) => {
        if (uuid == undefined) {
            resolve(false);
            return;
        }

        if (getFeatureStatus(require_service) == 'OPERATIONAL') {
            try{
                await config.SCF.API.score.saveMessage(uuid, nick, guild)
            }
            catch(e){
                console.log(e);
                disableFeature(require_service);
                resolve(false);
                return;
            }
        }

        resolve(true);
    });
}

async function SCFsaveStatus(botConnected, commit_version) {
    const require_service = 'Status';
    return new Promise(async (resolve, reject) => {
        if (getFeatureStatus(require_service) == 'OPERATIONAL') {
            try{
                await config.SCF.API.bridge.setStatus(botConnected, commit_version);
            }
            catch(e){
                console.log(e);
                disableFeature(require_service);
                resolve(false);
                return;
            }
        }

        resolve(true);
    });
}

async function SCFsaveLinked(discord_id, uuid) {
    const require_service = 'InternalAPI';
    return new Promise(async (resolve, reject) => {
        if (!config.API.SCF.enabled) {
            reject('This feature is not supported by this instance.');
            return;
        }

        if (getFeatureStatus(require_service) == 'OPERATIONAL') {
            try {
                await config.SCF.API.bridge.link(discord_id, uuid);
                resolve();
                return;
            } catch (e) {
                console.log(e);
                disableFeature(require_service);
                reject(e);
                return;
            }
        }

        reject('Failed to execute the request. Please try again later.');
    });
}

async function SCFgetCutoffScore(uuid, overall) {
    const require_service = 'InternalAPI';
    let response = {
        place: undefined,
        score: undefined
    };
    if (!config.API.SCF.enabled) {
        return response;
    }

    if (getFeatureStatus(require_service) == 'OPERATIONAL') {
        try{
            let info = await config.SCF.API.score.getCutoff(uuid, overall);
            response.place = info.place;
            response.score = info.score;
        }
        catch(e){
            console.log(e);
            disableFeature(require_service);
        }
    }

    return response;
}

async function SCFgetRollingScore(uuid, overall) {
    const require_service = 'InternalAPI';
    let response = {
        place: undefined,
        score: undefined
    };
    if (!config.API.SCF.enabled) {
        return response;
    }

    if (getFeatureStatus(require_service) == 'OPERATIONAL') {
        try{
            let info = await config.SCF.API.score.getRolling(uuid, overall);
            response.place = info.place;
            response.score = info.score;
        }
        catch(e){
            console.log(e);
            disableFeature(require_service);
        }
    }

    return response;
}

async function SCFgetMessagesTop(guild_id) {
    const require_service = 'InternalAPI';
    return new Promise(async (resolve, reject) => {
        if (!config.API.SCF.enabled) {
            resolve([]);
            return;
        }

        if (getFeatureStatus(require_service) == 'OPERATIONAL') {
            try{
                let top = await config.SCF.API.score.getTop(guild_id);
                resolve(top);
            }
            catch(e){
                console.log(e);
                disableFeature(require_service);
                resolve([]);
                return;
            }
        }

        resolve([]);
    });
}

async function SCFhandleLeave(uuid) {
    return new Promise(async (resolve, reject) => {
        if (!config.API.SCF.enabled) {
            resolve(true);
            return;
        }

        try{
            await config.SCF.API.longpoll.create("userLeave", "scf_management", {
                version: 1,
                uuid: uuid,
            })
            resolve(true);
            return;
        }
        catch(e){
            console.log(e);
            resolve(false);
            return;
        }
    });
}

async function SCFHypixelRequest(url) {
    const require_service = 'Hypixel';
    return new Promise(async (resolve, reject) => {
        let data = null;

        let proxy_url = url.replace('api.hypixel.net', config.API.tools.hypixel);

        if (getFeatureStatus(require_service) == 'OPERATIONAL') {
            try {
                data = (await axios.get(proxy_url)).data;

                resolve(data);
            } catch (e) {
                if (
                    (e?.response?.status ?? '').toString().startsWith('5') ||
                    (e?.response?.status ?? '').toString() == '429'
                ) {
                    console.log(e);
                    disableFeature(require_service);
                } else {
                    reject('Invalid username.');
                    return;
                }
            }
        }

        try {
            data = await axios.get(url);

            resolve(data?.data);
        } catch (e) {
            reject('Invalid username.');
            return;
        }
    });
}

module.exports = {
    status: status,
    checkBlacklist: SCFCheckBlacklist,
    checkBridgelock: SCFCheckBridgelock,
    getUUID: SCFgetUUID,
    getUsername: SCFgetUsername,
    getLinked: SCFgetLinked,
    saveMessage: SCFsaveMessage,
    saveStatus: SCFsaveStatus,
    saveLinked: SCFsaveLinked,
    getCutoffScore: SCFgetCutoffScore,
    getRollingScore: SCFgetRollingScore,
    getMessagesTop: SCFgetMessagesTop,
    handleLeave: SCFhandleLeave,
    hypixelRequest: SCFHypixelRequest
};
