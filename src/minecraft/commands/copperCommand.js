const minecraftCommand = require('../../contracts/minecraftCommand.js');
const { formatNumber, formatUsername } = require('../../contracts/helperFunctions.js');
const { getLatestProfile } = require('../../../API/functions/getLatestProfile.js');
const Logger = require('#root/src/Logger.js');

class CopperCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'copper';
        this.aliases = ['copper'];
        this.description = 'Shows the Copper of a User.';
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

            let copper = data?.v2?.profile?.garden_player_data.copper;

            this.send(
                `/${channel} ${username} has ${copper} Copper!`
            );
        } catch (error) {
            Logger.warnMessage(error);

            this.send(`/${channel} [ERROR] ${error}`);
        }
    }
}

module.exports = CopperCommand;
