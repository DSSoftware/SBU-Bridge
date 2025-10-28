const Logger = require('../Logger.js');
const config = require('#root/config.js').getConfig();
const { getUUID } = require('../contracts/API/PlayerDBAPI');
const Skykings = require('../../API/utils/skykings');
const Blacklist = require('../../API/utils/blacklist');
const SCFAPI = require('../../API/utils/scfAPIHandler.js');
const getDungeons = require('../../API/stats/dungeons.js');
const { getLatestProfile } = require('../../API/functions/getLatestProfile.js');
const { exec } = require('child_process');

let isActionRunning = false;

async function asyncExec(cmd) {
    return new Promise((resolve) => {
        exec(cmd, (error, stdout, stderr) => {
            Logger.warnMessage(stdout);
            resolve(true);
        });
    });
}

class APIManager {
    startLongpoll() {
        if (!config.API.SCF.enabled) return;

        setInterval(async () => {
            if (isActionRunning) {
                return;
            }

            isActionRunning = true;

            try {
                let requests = await config.SCF.API.longpoll.getApplicable();
                for (let action of requests) {
                    try {
                        let act_rid = action.rid ?? 'NONE';
                        let act_type = action.action ?? 'NONE';
                        let act_data = action.data ?? {};
                        let completed = false;

                        await new Promise(resolve => setTimeout(resolve, 500));
                    } catch (e) {
                        Logger.warnMessage(action);
                        Logger.warnMessage(e);
                    }
                }
            } catch (e) {
                Logger.warnMessage(e);
            }

            isActionRunning = false;
        }, 10000);
    }
}

module.exports = APIManager;
