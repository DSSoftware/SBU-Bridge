const configLoader = require('#root/config.js');

(async () => {
    const config = await configLoader.init();
    const cluster = require('node:cluster');
    const axios = require('axios');
    const Logger = require('./src/Logger.js');
    const error_reporting_url = config.API.tools.error_reporting;

    const fetch = require('node-fetch');
    if (cluster.isPrimary) {
        function sendWebhookLog(params) {
            fetch(error_reporting_url, {
                method: 'POST',
                headers: {
                    'Content-type': 'application/json',
                    "Authorization": config.discord.token
                },
                body: JSON.stringify(params)
            });
        }

        function messageHandler(message) {
            if (message.event_id && message.event_id === 'exceptionCaught') {
                let params = {
                    content: config.bot.commands.errorContent,
                    embeds: [
                        {
                            title: 'Bot Failed',
                            fields: [
                                {
                                    name: 'Exception Data',
                                    value: `\`\`\`${message.stack}\`\`\`\`\`\`${message.exception}\`\`\`\nInstance: \`${config.minecraft.bot.unique_id}\``
                                }
                            ],
                            color: 0x800000
                        }
                    ]
                };

                sendWebhookLog(params);
            }
            if (message.event_id === 'initialized') {
                let params = {
                    embeds: [
                        {
                            title: 'Bot Started',
                            fields: [
                                {
                                    name: 'Instance ID',
                                    value: `Instance: \`${config.minecraft.bot.unique_id}\``
                                }
                            ],
                            color: 0x008000
                        }
                    ]
                };

                sendWebhookLog(params);
            }
        }

        let process_state = false;
        let forced_shutdown = false;

        setInterval(startEmergencyLongpoll, 30000);
        async function startEmergencyLongpoll() {
            if (!config.API.SCF.enabled) return;
            try{
                let requests = await config.SCF.API.longpoll.getApplicable();

                for (let action of requests) {
                    try {
                        let act_rid = action.rid ?? 'NONE';
                        let act_type = action.action ?? 'NONE';
                        let act_data = action.data ?? {};
                        let completed = false;

                        if (act_type == 'forceReboot') {
                            process_state = false;
                            forced_shutdown = false;

                            for (const id in cluster.workers) {
                                cluster.workers[id].kill();
                            }

                            completed = true;
                        }

                        if (act_type == 'killYourself') {
                            setTimeout(() => { process.exit() }, 10000);

                            completed = true;
                        }

                        if (completed) {
                            await config.SCF.API.longpoll.remove(act_rid);
                        }
                    } catch (e) {
                        Logger.warnMessage(action);
                        Logger.warnMessage(e);
                    }
                }
            }
            catch(e){
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
                let params = {
                    content: config.bot.commands.errorContent,
                    embeds: [
                        {
                            title: 'Bot Stopped',
                            fields: [
                                {
                                    name: 'Exception Data',
                                    value: `Something bad has happened to the bot, maybe it's banned or muted. The app will shut down.\n\nInstance: \`${config.minecraft.bot.unique_id}\``
                                }
                            ],
                            color: 0x800000
                        }
                    ]
                };

                sendWebhookLog(params);

                forced_shutdown = true;

                Logger.errorMessage('The bot was shut down! Continuing to run the parent process...');
            }

            if (code == 124) {
                let params = {
                    content: config.bot.commands.errorContent,
                    embeds: [
                        {
                            title: 'Bot Rebooted',
                            fields: [
                                {
                                    name: 'Exception Data',
                                    value: `Bot failed to connect to Hypixel, so it rebooted.\n\nInstance: \`${config.minecraft.bot.unique_id}\``
                                }
                            ],
                            color: 0x800000
                        }
                    ]
                };

                sendWebhookLog(params);
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
        process.on('unhandledRejection', function (err, promise) {
            console.log('Unhandled rejection (promise: ', promise, ', reason: ', err, ').');
            Logger.warnMessage(`Unhandled rejection (promise: ${promise}, reason: ${err}).`);
            process.exit(1);
        });
        const app = require('./src/Application.js');
        const globalSbuService = require('./src/contracts/GlobalSbuService.js'); // Change this line

        ('use strict');

        app.register()
            .then(async () => {
                // Initialize Global SBU service if enabled
                if (config.API.SBU.enabled) {
                    try {
                        await globalSbuService.initialize();
                        Logger.infoMessage('Global SBU service initialized successfully');
                    } catch (error) {
                        Logger.warnMessage('Failed to initialize Global SBU service:', error.message);
                    }
                }
            
                return app.connect();
            })
            .catch((error) => {
                console.error(error);
            });
    }
})()
