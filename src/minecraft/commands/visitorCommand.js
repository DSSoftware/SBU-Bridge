const minecraftCommand = require('../../contracts/minecraftCommand.js');
const { formatNumber, formatUsername } = require('../../contracts/helperFunctions.js');
const { getLatestProfile } = require('../../../API/functions/getLatestProfile.js');
const Logger = require('#root/src/Logger.js');

class VisitorCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'visitor';
        this.aliases = ['visitor', 'visit'];
        this.description = 'Shows Garden Visitor Stats of a User.';
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

            const data = await getLatestProfile(username, { garden: true });

            username = formatUsername(username, data.profileData?.game_mode);

            const uni_vis = data.garden.commission_data.unique_npcs_served;
            const count_vis = data.garden.commission_data.total_completed;

            this.send(
                `/${channel} ${username} has ${count_vis} Visitors served and ${uni_vis} unique ones. `
            );
        } catch (error) {
            Logger.warnMessage(error);

            this.send(`/${channel} [ERROR] ${error}`);
        }
    }
}

module.exports = VisitorCommand;
