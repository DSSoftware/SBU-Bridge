const { getSkyblockCalendar } = require('../../../API/functions/getCalendar.js');
const minecraftCommand = require('../../contracts/minecraftCommand.js');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const config = require('#root/config.js').getConfig();
const axios = require('axios');
const Logger = require('#root/src/Logger.js');

async function getContestCrops(timestamp) {
    let next_contest = {
        time: null,
        crops: []
    };

    // Try DawJaw API first
    try {
        const response = await axios.get('https://dawjaw.net/jacobs');
        const contests = response.data;

        for (const contest of contests) {
            if (contest.time < timestamp) {
                continue;
            }

            if (next_contest.time === null || contest.time < next_contest.time) {
                next_contest.time = contest.time;
                next_contest.crops = contest.crops;
            }
        }

        return next_contest;
    }
    catch (e) {}

    // Try strassburger.dev API
    try {
        const response = await axios.get('https://jacobs.strassburger.dev/api/jacobcontests');
        const contests = response.data;

        for (const contest of contests) {
            if (contest.timestamp < timestamp) {
                continue;
            }

            if (next_contest.time === null || contest.timestamp < next_contest.time) {
                next_contest.time = contest.timestamp;
                next_contest.crops = contest.cropNames;
            }
        }

        return next_contest;
    }
    catch (e) {}

    // We have no datasources, just return null, I guess.
    return next_contest;
}

if (config.minecraft.skyblockEventsNotifications.enabled) {
    const { notifiers, customTime } = config.minecraft.skyblockEventsNotifications;

    setInterval(async () => {
        try {
            const eventBOT = new minecraftCommand(bot);
            const EVENTS = getSkyblockCalendar();
            for (const event in EVENTS.data.events) {
                const eventData = EVENTS.data.events[event];
                if (notifiers[event] === false) {
                    continue;
                }

                if (eventData.events[0].start_timestamp < Date.now()) {
                    continue;
                }

                const minutes = Math.floor((eventData.events[0].start_timestamp - Date.now()) / 1000 / 60);

                let extraInfo = '';
                if (event == 'JACOBS_CONTEST') {
                    let contest_time = Math.floor(eventData.events[0].start_timestamp / 1000);

                    let contest = await getContestCrops(contest_time)

                    if (contest.crops.length > 0) {
                        extraInfo = ` (${contest.crops.join(', ')})`;
                    }
                }

                const cTime = getCustomTime(customTime, event);
                if (cTime.length !== 0 && cTime.includes(minutes.toString())) {
                    eventBOT.send(`/gc [EVENT] ${eventData.name}${extraInfo}: Starting in ${minutes}m`);
                    await delay(1500);
                }
            }
        } catch (e) {
            Logger.warnMessage(e);
            /* empty */
        }
    }, 60000);
}

function getCustomTime(events, value) {
    if (events === undefined || value === undefined) {
        return false;
    }

    return Object.keys(events).filter((key) => events[key].includes(value));
}
