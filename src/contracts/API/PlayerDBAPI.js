const axios = require('axios');
const config = require('../../../config');
const Logger = require('../../Logger');

const cache = new Map();

setInterval(
    () => {
        Logger.infoMessage(`Cleared up UUID Cache (Entries: ${cache?.size ?? 0})`);
        cache.clear();
    },
    30 * 60 * 1000
);

async function getUUID(username, full = false) {
    try {
        if (cache.has(username.toLowerCase())) {
            const data = cache.get(username.toLowerCase());

            if (full) {
                return {
                    uuid: data.id,
                    username: data.name
                };
            }

            return data.id;
        }

        let uuid = null;
        let ign = null;

        if (config.minecraft.API.mojang_resolver) {
            const { data } = await axios.get(
                `https://api.minecraftservices.com/minecraft/profile/lookup/name/${username}`
            );

            if (data.errorMessage || data.id === undefined) {
                throw data.errorMessage ?? 'Invalid username.';
            }

            uuid = data.id;
            ign = data.name;
        } else {
            const { data } = await axios.get(`https://mojang.dssoftware.ru/?nick=${username}`);

            if (data.success == false || data.id === null) {
                throw 'Invalid username.';
            }

            uuid = data.id;
            ign = data.name;
        }

        if (uuid == null || ign == null) {
            throw 'Invalid username.';
        }

        let correct_uuid = uuid.replace(/-/g, '');

        cache.set(ign.toLowerCase(), {
            last_save: Date.now(),
            id: correct_uuid,
            name: ign
        });

        if (full) {
            return {
                uuid: correct_uuid,
                username: ign
            };
        }
        return correct_uuid;
    } catch (error) {
        console.log(error);
        const err = error?.response?.status ?? 'Invalid username.';
        if (err == 404) {
            throw 'Invalid username.';
        }
        if (err == 403) {
            throw 'Request was blocked.';
        }
        if (err == 400) {
            throw 'Malformed username.';
        }
        if (err == 429) {
            throw 'Too many requests.';
        }
        throw `Code: ${err}`;
    }
}

async function getUsername(uuid) {
    try {
        const { data } = await axios.get(`https://mojang.dssoftware.ru/?uuid=${uuid}`);
        return data.name ?? "N/A";
    } catch (error) {
        console.log(error);
    }
}

async function resolveUsernameOrUUID(username) {
    try {
        return getUUID(username, true);
    } catch (error) {
        console.log(error);
    }
}

module.exports = { getUUID, getUsername, resolveUsernameOrUUID };
