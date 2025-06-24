const minecraftCommand = require('../../contracts/minecraftCommand.js');
const config = require('#/config.js').getConfig();('../../../config.js');

class DiscordLinkCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'discord';
        this.aliases = ['dc'];
        this.description = 'Sends a link to the Discord server.';
        this.options = [];
    }

    onCommand(username, message, channel = 'gc') {
        try {
            this.send(`/${channel} Join our discord - ${config.minecraft.guild.discord_invite}`);
        } catch (error) {
            this.send(`/${channel} Something went wrong...`);
        }
    }
}

module.exports = DiscordLinkCommand;
