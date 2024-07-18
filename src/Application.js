const DiscordManager = require('./discord/DiscordManager.js');
const MinecraftManager = require('./minecraft/MinecraftManager.js');
const apiManager = require('./api/APIManager.js');
const ReplicationManager = require('./replication/ReplicationManager.js');
const SCFAPI = require('./../API/utils/scfAPIHandler.js');
const Logger = require('./Logger.js');
const config = require('../config.js');
const axios = require('axios');
const fs = require('fs').promises;

const getGitId = async () => {
    try {
        const gitId = await fs.readFile('.git/HEAD', 'utf8');
        if (gitId.indexOf(':') === -1) {
            return gitId;
        }
        const refPath = '.git/' + gitId.substring(5).trim();
        return await fs.readFile(refPath, 'utf8');
    } catch (e) {
        return 'N/A';
    }
};

class Application {
    async register() {
        this.discord = new DiscordManager(this);
        this.minecraft = new MinecraftManager(this);
        this.api = new apiManager(this);

        this.discord.setBridge(this.minecraft);
        this.minecraft.setBridge(this.discord);

        if (config.discord.replication.enabled) {
            this.replication = new ReplicationManager(this);

            this.replication.setBridge(this.minecraft);
            this.replication.setBridge(this.discord);

            this.discord.setBridge(this.replication);
            this.minecraft.setBridge(this.replication);
        }
    }

    async connect() {
        this.discord.connect();
        this.minecraft.connect();
        this.api.startLongpoll();
        if (config.discord.replication.enabled) {
            this.replication.connect();
        }

        let fail_checks = 0;

        async function sendStatus() {
            function isBotOnline() {
                if (bot === undefined || bot._client.chat === undefined) {
                    return 0;
                }

                return 1;
            }

            let botConnected = isBotOnline();

            let commit_version = ((await getGitId()) ?? 'N/A').slice(0, 7);

            if (botConnected == 0) {
                fail_checks++;
                Logger.warnMessage(`Bot isn't connected to Hypixel. Error ${fail_checks}/5.`);
            } else {
                if (fail_checks != 0) {
                    Logger.warnMessage(`Reset failchecks.`);
                }
                fail_checks = 0;
            }

            SCFAPI.saveStatus(botConnected, commit_version);

            if (fail_checks >= 5) {
                Logger.errorMessage(`Bot will reboot, as it failed the max amount of failchecks (5/5).`);
                process.exit(124);
            }
        }

        sendStatus();
        setInterval(sendStatus, 30000);
    }
}

module.exports = new Application();
