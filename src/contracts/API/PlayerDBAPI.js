const Logger = require('../../Logger');
const SCFAPI = require('../../../API/utils/scfAPIHandler');

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

        const response = await SCFAPI.getUUID(username);

        let uuid = response.id;
        let ign = response.name;

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
        Logger.warnMessage(error);
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
        const data = await SCFAPI.getUsername(uuid);
        return data.name ?? "N/A";
    } catch (error) {
        Logger.warnMessage(error);
    }
}

async function resolveUsernameOrUUID(username) {
    try {
        return getUUID(username, true);
    } catch (error) {
        Logger.warnMessage(error);
    }
}

module.exports = { getUUID, getUsername, resolveUsernameOrUUID };
