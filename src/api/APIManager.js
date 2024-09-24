const Logger = require('../Logger.js');
const config = require('../../config.js');
const axios = require('axios');
const { getUUID } = require('../contracts/API/PlayerDBAPI');
const hypixel = require('../contracts/API/HypixelRebornAPI.js');
const Skykings = require('../../API/utils/skykings');
const Blacklist = require('../../API/utils/blacklist');
const SCFAPI = require('../../API/utils/scfAPIHandler.js');
const { getNetworth } = require('skyhelper-networth');
const getDungeons = require('../../API/stats/dungeons.js');
const getSkills = require('../../API/stats/skills.js');
const getSlayer = require('../../API/stats/slayer.js');
const { getLatestProfile } = require('../../API/functions/getLatestProfile.js');
const { exec } = require('child_process');

let isActionRunning = false;

class APIManager {
    startLongpoll() {
        if (!config.longpoll.enabled) return;

        setInterval(async () => {
            if (isActionRunning) {
                return;
            }

            let request_url = `${config.longpoll.provider}?method=getRequests&api=${config.minecraft.API.SCF.key}`;

            isActionRunning = true;

            try {
                let response = await axios.get(request_url).catch(e => {
                    // Do nothing
                });
                for (let action of Object.values(response?.data?.requests ?? {})) {
                    try {
                        let act_rid = action?.rid ?? 'NONE';
                        let act_type = action?.action ?? 'NONE';
                        let act_data = action?.data ?? {};
                        let completed = false;

                        if (act_type == 'kick') {
                            const username = act_data.username;
                            const reason = act_data.reason;

                            bot.chat('/g kick ' + username + ' ' + reason);
                            completed = true;
                        }
                        if (act_type == 'setrank') {
                            const username = act_data.username;
                            const rank = act_data.newRank;

                            bot.chat(`/g setrank ${username} ${rank}`);
                            completed = true;
                        }
                        if (act_type == 'invite') {
                            const username = act_data.username;

                            const uuid = await getUUID(username);
                            const skykings_scammer = await Skykings.lookupUUID(uuid);
                            const blacklisted = await Blacklist.checkBlacklist(uuid);
                            const scf_blacklisted = await SCFAPI.checkBlacklist(uuid);

                            // Checking the requirements

                            let passed_requirements = true;

                            try {
                                let profile = await getLatestProfile(uuid);

                                const skyblockLevel = (profile?.profile?.leveling?.experience || 0) / 100 ?? 0;
                                const dungeonsStats = getDungeons(profile.profile, undefined);
                                const catacombsLevel = Math.round(
                                    dungeonsStats?.catacombs?.skill?.levelWithProgress || 0
                                );

                                // MAIN REQS
                                if (skyblockLevel < config.minecraft.guildRequirements.requirements.skyblockLevel) {
                                    passed_requirements = false;
                                }
                                if (catacombsLevel < config.minecraft.guildRequirements.requirements.catacombsLevel) {
                                    passed_requirements = false;
                                }
                                // MAIN REQS

                            } catch (e) {
                                // Failed to lookup player data.
                                Logger.warnMessage(e);
                            }
                            //

                            if (
                                skykings_scammer !== true &&
                                blacklisted !== true &&
                                scf_blacklisted !== true &&
                                passed_requirements === true
                            ) {
                                bot.chat(`/guild invite ${username}`);
                            }

                            completed = true;
                        }
                        if (act_type == 'forceInvite') {
                            const username = act_data.username;
                            const uuid = act_data.uuid;

                            const skykings_scammer = await Skykings.lookupUUID(uuid);
                            const blacklisted = await Blacklist.checkBlacklist(uuid);
                            const scf_blacklisted = await SCFAPI.checkBlacklist(uuid);

                            if (skykings_scammer !== true && blacklisted !== true && scf_blacklisted !== true) {
                                bot.chat(`/guild invite ${username}`);
                            }

                            completed = true;
                        }
                        if (act_type == 'deploy') {
                            async function updateCode() {
                                async function asyncExec(cmd){
                                    return new Promise((resolve) => {
                                        exec(cmd, (error, stdout, stderr) => {
                                            Logger.warnMessage(stdout);
                                            resolve(true);
                                        });
                                    });
                                }

                                await asyncExec('git pull');
                                await asyncExec('git fetch --all');
                                await asyncExec('git reset --hard');
                                await asyncExec('npm install');
                                await asyncExec('npm update');

                                process.exit(5);
                            }

                            let timeout = (act_data.timeout ?? 0) * 10000;
                            setTimeout(updateCode, timeout);

                            completed = true;
                        }

                        if(completed){
                            let confirm_url = `${config.longpoll.provider}?method=completeRequest&api=${config.minecraft.API.SCF.key}&rid=${act_rid}`;
                            await axios.get(confirm_url).catch(e => {
                                // Do nothing.
                            });
                        }
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
