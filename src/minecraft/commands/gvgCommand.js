const minecraftCommand = require('../../contracts/minecraftCommand.js');
const axios = require('axios');

class GvgCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'gvg';
        this.aliases = ['skykings'];
        this.description = 'Infos about the Skykings GVG.';
    }

    async onCommand(username, message, channel = 'gc') {
        try {
            this.send(`/${channel} Find out about the Skykings Guild vs Guild Event on skykings.net/guild-war.`);
        } catch (error) {
            this.send(`/${channel} [ERROR] ${error}`);
        }
    }
}

module.exports = GvgCommand;
