const Logger = require('../Logger.js');
const config = require('../../config.js');
const axios = require('axios');

const { getUUID } = require('../contracts/API/PlayerDBAPI');
const hypixel = require('../contracts/API/HypixelRebornAPI.js');
const Skykings = require('../../API/utils/skykings');
const Blacklist = require('../../API/utils/blacklist');
const SCFBlacklist = require('../../API/utils/scfBlacklist');
const { getNetworth } = require('skyhelper-networth');
const getDungeons = require('../../API/stats/dungeons.js');
const getSkills = require('../../API/stats/skills.js');
const getSlayer = require('../../API/stats/slayer.js');
const { getLatestProfile } = require('../../API/functions/getLatestProfile.js');

let isActionRunning = false;

class APIManager {
    startLongpoll() {
        if (config.longpoll.enabled === false) return;

        setInterval(async () => {
            if (isActionRunning) {
                return;
            }

            let request_url = `${config.longpoll.provider}?method=getRequests&api=${config.minecraft.API.SCF.key}`;

            isActionRunning = true;

            try {
                let response = await axios.get(request_url);
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
                            const scf_blacklisted = await SCFBlacklist.checkBlacklist(uuid);

                            // Checking the requirements

                            let skill_requirements = false;

                            let masteries_data = {
                                passed: 5,
                                required: 5 - config.minecraft.guildRequirements.requirements.masteries.maximumFailed,
                                masteries: {
                                    skyblockLevel: {
                                        current: 0,
                                        required:
                                            config.minecraft.guildRequirements.requirements.masteries.skyblockLevel
                                    },
                                    catacombsLevel: {
                                        current: 0,
                                        required:
                                            config.minecraft.guildRequirements.requirements.masteries.catacombsLevel
                                    },
                                    networth: {
                                        current: 0,
                                        required: config.minecraft.guildRequirements.requirements.masteries.networth
                                    },
                                    skillAverage: {
                                        current: 0,
                                        required: config.minecraft.guildRequirements.requirements.masteries.skillAverage
                                    },
                                    slayerEXP: {
                                        current: 0,
                                        required: config.minecraft.guildRequirements.requirements.masteries.slayerEXP
                                    }
                                }
                            };

                            let passed_requirements = true;
                            let masteries_failed = 0;
                            let masteries_passed = false;

                            try {
                                let profile = await getLatestProfile(uuid);

                                const skyblockLevel = (profile?.profile?.leveling?.experience || 0) / 100 ?? 0;
                                const dungeonsStats = getDungeons(profile.playerRes, profile.profile);
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

                                if (
                                    config.minecraft.guildRequirements.requirements.masteries.masteriesEnabled ===
                                    'true'
                                ) {
                                    const networthCalculated = await getNetworth(
                                        profile.profile,
                                        profile.profileData?.banking?.balance || 0,
                                        {
                                            onlyNetworth: true,
                                            museumData: profile.museum
                                        }
                                    );

                                    const calculatedSkills = getSkills(profile.profile);

                                    const skillAverage =
                                        Object.keys(calculatedSkills)
                                            .filter((skill) => !['runecrafting', 'social'].includes(skill))
                                            .map((skill) => calculatedSkills[skill].levelWithProgress || 0)
                                            .reduce((a, b) => a + b, 0) /
                                        (Object.keys(calculatedSkills).length - 2);

                                    const calculatedSlayers = getSlayer(profile.profile);
                                    let slayerXP = 0;
                                    Object.keys(calculatedSlayers).reduce((acc, slayer) => {
                                        slayerXP += calculatedSlayers[slayer].xp ?? 0;
                                    });

                                    // MASTERIES
                                    masteries_data.masteries.skyblockLevel.current = skyblockLevel;
                                    masteries_data.masteries.catacombsLevel.current = catacombsLevel;
                                    masteries_data.masteries.networth.current = networthCalculated.networth;
                                    masteries_data.masteries.skillAverage.current = skillAverage;
                                    masteries_data.masteries.slayerEXP.current = slayerXP;

                                    if (
                                        skyblockLevel <
                                        config.minecraft.guildRequirements.requirements.masteries.skyblockLevel
                                    ) {
                                        masteries_failed += 1;
                                    }
                                    if (
                                        catacombsLevel <
                                        config.minecraft.guildRequirements.requirements.masteries.catacombsLevel
                                    ) {
                                        masteries_failed += 1;
                                    }
                                    if (
                                        (networthCalculated.networth ?? 0) <
                                        config.minecraft.guildRequirements.requirements.masteries.networth
                                    ) {
                                        masteries_failed += 1;
                                    }
                                    if (
                                        skillAverage <
                                        config.minecraft.guildRequirements.requirements.masteries.skillAverage
                                    ) {
                                        masteries_failed += 1;
                                    }
                                    if (
                                        slayerXP < config.minecraft.guildRequirements.requirements.masteries.slayerEXP
                                    ) {
                                        masteries_failed += 1;
                                    }

                                    masteries_data.passed -= masteries_failed;

                                    if (
                                        masteries_failed <=
                                        config.minecraft.guildRequirements.requirements.masteries.maximumFailed
                                    ) {
                                        masteries_passed = true;
                                    }
                                    // MASTERIES
                                } else {
                                    masteries_passed = true;
                                }

                                skill_requirements = passed_requirements && masteries_passed;
                            } catch (e) {
                                // Failed to lookup player data.
                                console.log(e);
                            }
                            //

                            if (
                                skykings_scammer !== true &&
                                blacklisted !== true &&
                                scf_blacklisted !== true &&
                                skill_requirements === true
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
                            const scf_blacklisted = await SCFBlacklist.checkBlacklist(uuid);

                            if (skykings_scammer !== true && blacklisted !== true && scf_blacklisted !== true) {
                                bot.chat(`/guild invite ${username}`);
                            }

                            completed = true;
                        }


                        if(completed){
                            let confirm_url = `${config.longpoll.provider}?method=completeRequest&api=${config.minecraft.API.SCF.key}&rid=${act_rid}`;
                            await axios.get(confirm_url);
                        }
                    } catch (e) {
                        console.log(action);
                        console.log(e);
                    }
                }
            } catch (e) {
                console.log(e);
            }

            isActionRunning = false;
        }, 10000);
    }
}

module.exports = APIManager;
