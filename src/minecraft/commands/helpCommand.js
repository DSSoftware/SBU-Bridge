const minecraftCommand = require('../../contracts/minecraftCommand.js');
const config = require('#root/config.js').getConfig();

class HelpCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'help';
        this.aliases = ['info'];
        this.description = 'Shows help menu';
        this.options = [];
    }

    onCommand(username, message, channel = 'gc') {
        try {
            this.send(`/${channel} Cannot send help list due to Hypixel limits :( Please run /${config.minecraft.bot.guild_prefix}help in Discord.`);
        } catch (error) {
            this.send(`/${channel} Something went wrong..`);
        }
    }
}

module.exports = HelpCommand;
