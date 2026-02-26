const minecraftCommand = require('../../contracts/minecraftCommand.js');
const { formatNumber, formatUsername } = require('../../contracts/helperFunctions.js');
const { getLatestProfile } = require('../../../API/functions/getLatestProfile.js');
const Logger = require('#root/src/Logger.js');

class ChipsCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'chips';
        this.aliases = ['chip'];
        this.description = 'Shows the Garden Chips of a User.';
        this.options = [
            {
                name: 'username',
                description: 'Minecraft username',
                required: false
            }
        ];
    }

    async onCommand(username, message, channel = 'gc') {
        try {
            username = this.getArgs(message)[0] || username;

            const data = await getLatestProfile(username);
            console.log(data.garden);
            username = formatUsername(username, data.profileData?.game_mode);

            let cropshot = 2;

            this.send(
                `/${channel} ${username} Chips | Cropshot: ${cropshot} `
            );
        } catch (error) {
            Logger.warnMessage(error);

            this.send(`/${channel} [ERROR] ${error}`);
        }
    }
}

module.exports = ChipsCommand;
