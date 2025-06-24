const config = require('#root/config.js').getConfig();
const axios = require('axios');

const status = {};

for(const service of Object.keys(config.behavior)){
    status[service] = {
        status: false,
        errorsCounter: 0,
        disableCounter: 0,
        updated: 0
    };
}

setInterval(() => {
    for(const service of Object.keys(status)){
        if(status[service].errorsCounter != 0){
            SCFsaveLogging("health", `Service ${service} had ${status[service].errorsCounter} errors in the past 5 minutes.`);
        }
        status[service].errorsCounter = 0;
    }
}, 5*60*1000);


function disableFeature(feature) {
    status[feature].errorsCounter += 1;

    if((status[feature].errorsCounter < 5) && (status[feature].disableCounter == 0)){
        return;
    }

    let disable_ctr = (status?.[feature].disableCounter ?? 0) + 1;
    let disable_updated = Date.now();
    let permanent_disable = false;

    console.log(`[FEATURES] Disabled feature ${feature} (Disable #${disable_ctr}).`);

    if(disable_ctr >= 10){
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

    if(permanent_disable){
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
    if (data.updated + 5*60*1000*(data.disableCounter+1) > Date.now()) {
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
    const require_service = "Blacklist";
    return new Promise(async (resolve, reject) => {
        if (!config.API.SCF.enabled) {
            resolve(false);
            return;
        }

        let isBanned = false;

        if (getFeatureStatus(require_service) == 'OPERATIONAL') {
            let player_banned = await Promise.all([
                axios.get(
                    `${config.API.SCF.provider}?method=isBanned&uuid=${uuid}&api=${config.API.SCF.key}`
                )
            ]).catch((error) => {
                SCFsaveLogging("error", `${error}`);
                disableFeature(require_service);
                resolve(false);
            });
            
            player_banned = player_banned?.[0]?.data ?? {};
            isBanned = player_banned.data === true;
        }

        resolve(isBanned);
    });
}

async function SCFgetUUID(username) {
    const require_service = "Mojang";
    return new Promise(async (resolve, reject) => {
        let data = null;

        if (getFeatureStatus(require_service) == 'OPERATIONAL') {
            try {
                data = (await axios.get(`${config.API.SCF.mojang}?nick=${username}`)).data;

                if (data?.success == true && data?.id != null) {
                    resolve(data);
                    return;
                }
            } catch (e) {
                if ((e?.response?.status ?? '').toString().startsWith('5')) {
                    SCFsaveLogging("error", `${e}`);
                    disableFeature(require_service);
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

async function SCFgetUsername(uuid) {
    const require_service = "Mojang";
    return new Promise(async (resolve, reject) => {
        let data = null;

        if (getFeatureStatus(require_service) == 'OPERATIONAL') {
            try {
                data = (await axios.get(`${config.API.SCF.mojang}?uuid=${uuid}`)).data;
                resolve(data);
                return;
            } catch(e){
                SCFsaveLogging("error", `${e}`);
                disableFeature(require_service);
            }
        }

        try{
            data = await axios.get(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`);

            resolve(data?.data);
        }
        catch(e){
            resolve({});
        }
    });
}

async function SCFCheckBridgelock(uuid) {
    const require_service = "Bridgelock";
    return new Promise(async (resolve, reject) => {
        if (!config.API.SCF.enabled) {
            resolve(false);
            return;
        }

        let isLocked = false;

        if (getFeatureStatus(require_service) == 'OPERATIONAL') {
            let player_banned = await Promise.all([
                axios.get(
                    `${config.API.SCF.provider}?method=isBridgeLocked&uuid=${uuid}&api=${config.API.SCF.key}`
                )
            ]).catch((error) => {
                SCFsaveLogging("error", `${error}`);
                disableFeature(require_service);
                resolve(false);
            });

            player_banned = player_banned?.[0]?.data ?? {};
            isLocked = player_banned?.data?.locked === true;
        }

        resolve(isLocked);
    });
}

async function SCFgetLinked(discord_id) {
    const require_service = "Link";
    return new Promise(async (resolve, reject) => {
        let response = undefined;

        if (getFeatureStatus(require_service) == 'OPERATIONAL') {
            let player_info = await Promise.all([
                axios.get(
                    `${config.API.SCF.provider}?method=getLinked&discord_id=${discord_id}&api=${config.API.SCF.key}`
                )
            ]).catch((error) => {
                SCFsaveLogging("error", `${error}`);
                disableFeature(require_service);
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
    const require_service = "Score";
    return new Promise(async (resolve, reject) => {
        if (uuid == undefined) {
            resolve(false);
            return;
        }

        if (getFeatureStatus(require_service) == 'OPERATIONAL') {
            let message_send = await Promise.all([
                axios.get(
                    `${config.API.SCF.provider}?method=saveGuildMessage&uuid=${uuid}&source=${source}&api=${config.API.SCF.key}&nick=${nick}&guild_id=${guild}`
                )
            ]).catch((error) => {
                SCFsaveLogging("error", `${error}`);
                disableFeature(require_service);
            });
        }

        resolve(true);
    });
}

async function SCFsaveStatus(botConnected, commit_version) {
    const require_service = "Status";
    return new Promise(async (resolve, reject) => {
        if (getFeatureStatus(require_service) == 'OPERATIONAL') {
            let statusURL = `${config.API.SCF.provider}?method=updateBridgeStatus&api=${config.API.SCF.key}&connected=${botConnected}&version=${commit_version}`;

            axios.get(statusURL)
                .then(function (response) {
                    resolve(true);
                })
                .catch(function (error) {
                    SCFsaveLogging("error", `${error}`);
                    disableFeature(require_service);
                    resolve(false);
                });
        }

        resolve(true);
    });
}

async function SCFsaveLinked(discord_id, uuid, tag) {
    const require_service = "InternalAPI";
    return new Promise(async (resolve, reject) => {
        if (!config.API.SCF.enabled) {
            reject("This feature is not supported by this instance.");
            return;
        }

        if (getFeatureStatus(require_service) == 'OPERATIONAL') {
            let player_info = await Promise.all([
                axios.get(
                    `${config.API.SCF.provider}?method=saveLinked&discord_id=${discord_id}&uuid=${uuid}&api=${config.API.SCF.key}&tag=${tag}`
                )
            ]).catch((error) => {
                SCFsaveLogging("error", `${error}`);
                disableFeature(require_service);
                reject(error);
            });

            player_info = player_info?.[0]?.data ?? {};
            resolve(player_info);
        }

        reject("Failed to execute the request. Please try again later.");
    });
}

async function SCFgetMessagesSent(uuid, overall) {
    const require_service = "InternalAPI";
    return new Promise(async (resolve, reject) => {
        if (!config.API.SCF.enabled) {
            resolve({});
            return;
        }

        if (getFeatureStatus(require_service) == 'OPERATIONAL') {
            let player_info = await Promise.all([
                axios.get(
                    `${config.API.SCF.provider}?method=getMessagesSent&uuid=${uuid}&api=${config.API.SCF.key}&overall=${overall}`
                )
            ]).catch((error) => {
                SCFsaveLogging("error", `${error}`);
                disableFeature(require_service);
                resolve({});
            });

            player_info = player_info?.[0]?.data ?? {};
            resolve(player_info);
        }

        resolve({});
    });
}

async function SCFgetMessagesTop(guild_id) {
    const require_service = "InternalAPI";
    return new Promise(async (resolve, reject) => {
        if (!config.API.SCF.enabled) {
            resolve({});
            return;
        }

        if (getFeatureStatus(require_service) == 'OPERATIONAL') {
            let player_info = await Promise.all([
                axios.get(
                    `https://sky.dssoftware.ru/api.php?method=getMessagesTop&api=${config.API.SCF.key}&guild_id=${guild_id}`
                )
            ]).catch((error) => {
                SCFsaveLogging("error", `${error}`);
                disableFeature(require_service);
                resolve({});
            });

            player_info = player_info?.[0]?.data ?? {};
            resolve(player_info);
        }

        resolve({});
    });
}

async function SCFsaveLogging(type, message) {
    const require_service = "Logging";
    return new Promise(async (resolve, reject) => {
        if(!config.bot.other.logExtensively){
            resolve(true);
            return;
        }
        if (getFeatureStatus(require_service) == 'OPERATIONAL') {
            message = encodeURIComponent(JSON.stringify(message)); 
            let loggingURL = `${config.API.SCF.provider}?method=saveLogging&api=${config.API.SCF.key}&type=${type}&message=${message}&bridge=${config.minecraft.bot.unique_id}`;

            axios.get(loggingURL)
                .then(function (response) {
                    resolve(true);
                })
                .catch(function (error) {
                    // NOT DISABLING THE SERVICE, OR IT WILL BASICALLY CAUSE A CHAIN REACTION
                    resolve(false);
                });
        }

        resolve(true);
    });
}

async function SCFSendIGCMessage(uuid, message) {
    return new Promise(async (resolve, reject) => {
        return;
        axios.post(config.discord.IGC.endpoint, {
            message: message,
            uuid: uuid, 
            collector: config.discord.IGC.collectorID
        }).then(function (response) {
            resolve(true);
        })
        .catch(function (error) {
            resolve(false);
        });

    });
}

async function SCFhandleLeave(username){
    return new Promise(async (resolve, reject) => {
        if (!config.API.SCF.enabled) {
            resolve(true);
            return;
        }
        
        let player_info = await Promise.all([
            axios.get(
                `https://sky.dssoftware.ru/discord/handler.php?api=${config.API.SCF.key}&action=guild_kick&nick=${username}`
            )
        ]).catch((error) => {
            SCFsaveLogging("error", `${error}`);
            resolve(false);
        });

        resolve(true);
    });
}

async function SCFHypixelRequest(url){
    const require_service = "Hypixel";
    return new Promise(async (resolve, reject) => {
        let data = null;

        let proxy_url = url.replace("api.hypixel.net", "hypixel.dssoftware.ru");

        if (getFeatureStatus(require_service) == 'OPERATIONAL') {
            try {
                data = (await axios.get(proxy_url)).data;

                resolve(data);
            } catch (e) {
                if ((e?.response?.status ?? '').toString().startsWith('5') || (e?.response?.status ?? '').toString() == '429') {
                    SCFsaveLogging("error", `${e}`);
                    disableFeature(require_service);
                } else {
                    reject('Invalid username.');
                    return;
                }
            }
        }

        try{
            data = await axios.get(url);

            resolve(data?.data);
        }
        catch(e){
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
    getMessagesSent: SCFgetMessagesSent,
    getMessagesTop: SCFgetMessagesTop,
    saveLogging: SCFsaveLogging,
    handleLeave: SCFhandleLeave,
    sendIGCMessage: SCFSendIGCMessage,
    hypixelRequest: SCFHypixelRequest,
};
