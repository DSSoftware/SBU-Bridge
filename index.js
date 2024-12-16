const cluster = require('node:cluster');
const axios = require('axios');
const config = require('./config.js');
const Logger = require('./src/Logger.js');

const webhook_url = config.minecraft.API.SCF.fail_webhook;

const fetch = require('node-fetch');

if (cluster.isPrimary) {
    function messageHandler(message) {
        if (message.event_id && message.event_id === 'exceptionCaught') {
            var params = {
                content: config.discord.commands.errorContent,
                embeds: [
                    {
                        title: 'Bot Failed',
                        fields: [
                            {
                                name: 'Exception Data',
                                value: `\`\`\`${message.stack}\`\`\`\`\`\`${message.exception}\`\`\`\nInstance: \`${config.minecraft.bot.unique_id}\``
                            }
                        ]
                    }
                ]
            };

            fetch(webhook_url, {
                method: 'POST',
                headers: {
                    'Content-type': 'application/json'
                },
                body: JSON.stringify(params)
            });
        }
    }

    let process_state = false;
    let forced_shutdown = false;

    setInterval(startEmergencyLongpoll, 30000);
    async function startEmergencyLongpoll() {
        if (!config.longpoll.enabled) return;

            let request_url = `${config.longpoll.provider}?method=getRequests&api=${config.minecraft.API.SCF.key}`;

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

                        if (act_type == 'forceReboot') {
                            process_state = false;
                            forced_shutdown = false;

                            for (const id in cluster.workers) {
                                cluster.workers[id].kill();
                            }

                            completed = true;
                        }

                        if(completed){
                            let confirm_url = `${config.longpoll.provider}?method=completeRequest&api=${config.minecraft.API.SCF.key}&rid=${act_rid}`;
                            await axios.get(confirm_url).catch(e => {
                                // Do nothing.
                            });
                        }
                    } catch (e) {
                        Logger.warnMessage(action);
                        Logger.warnMessage(e);
                    }
                }
            } catch (e) {
                Logger.warnMessage(e);
            }        
    }

    function reforkProcess() {
        cluster.fork();

        process_state = true;

        for (const id in cluster.workers) {
            cluster.workers[id].on('message', messageHandler);
        }
    }

    function checkInstructions() {
        if (forced_shutdown) {
            return;
        }
        let requested_state = 1;

        if (requested_state === 1) {
            if (!process_state) {
                reforkProcess();
            }
        } else {
            if (process_state) {
                for (const id in cluster.workers) {
                    cluster.workers[id].kill();
                }
            }
        }
    }

    checkInstructions();
    setInterval(checkInstructions, 30000);

    cluster.on('exit', function (worker, code, signal) {
        process_state = false;
        if (code == 123) {
            var params = {
                content: config.discord.commands.errorContent,
                embeds: [
                    {
                        title: 'Bot Stopped',
                        fields: [
                            {
                                name: 'Exception Data',
                                value: `Something bad has happened to the bot, maybe it's banned or muted. The app will shut down.\n\nInstance: \`${config.minecraft.bot.unique_id}\``
                            }
                        ]
                    }
                ]
            };

            fetch(webhook_url, {
                method: 'POST',
                headers: {
                    'Content-type': 'application/json'
                },
                body: JSON.stringify(params)
            });

            forced_shutdown = true;

            Logger.errorMessage('The bot was shut down! Continuing to run the parent process...');
        }

        if (code == 124) {
            var params = {
                content: config.discord.commands.errorContent,
                embeds: [
                    {
                        title: 'Bot Rebooted',
                        fields: [
                            {
                                name: 'Exception Data',
                                value: `Bot failed to connect to Hypixel, so it rebooted.\n\nInstance: \`${config.minecraft.bot.unique_id}\``
                            }
                        ]
                    }
                ]
            };

            fetch(webhook_url, {
                method: 'POST',
                headers: {
                    'Content-type': 'application/json'
                },
                body: JSON.stringify(params)
            });
        }

        if (code == 5) {
            Logger.warnMessage('The bot is deploying the new version...');
            process.exit();
        }
        Logger.infoMessage(`Fork exited with exit code ${code}.`);
    });
}

if (cluster.isWorker) {
    process.on('uncaughtException', (error) => {
        console.log(error);
        Logger.infoMessage(error);
        process.send({
            event_id: 'exceptionCaught',
            exception: error.message,
            stack: error.stack
        });
        process.exit(1);
    });
    process.on('unhandledRejection', function(err, promise) {
        console.log('Unhandled rejection (promise: ', promise, ', reason: ', err, ').');
        Logger.warnMessage(`Unhandled rejection (promise: ${promise}, reason: ${err}).`);
        /*process.send({
            event_id: 'exceptionCaught',
            exception: "Unhandled rejection. Check logs. (" + promise + ")",
            stack: "Cannot fit rejection message here, check logs."
        });*/
        process.exit(1);
    });
    const app = require('./src/Application.js');

    ('use strict');

    app.register()
        .then(() => {
            app.connect();
        })
        .catch((error) => {
            console.error(error);
        });
}
