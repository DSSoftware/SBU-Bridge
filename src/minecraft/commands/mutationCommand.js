const minecraftCommand = require('../../contracts/minecraftCommand.js');
const { formatNumber, formatUsername } = require('../../contracts/helperFunctions.js');
const { getLatestProfile } = require('../../../API/functions/getLatestProfile.js');
const Logger = require('#root/src/Logger.js');

class MutationCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'mutation';
        this.aliases = ['mutation', 'mut'];
        this.description = 'Skyblock Garden Mutation Stats of specified user.';
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

            let mutation_amount = data?.v2?.profile?.garden_player_data.analyzed_greenhouse_crops;

            this.send(
                `/${channel} ${username} has ${mutation_amount} / 40 mutations unlocked`
            );
        } catch (error) {
            Logger.warnMessage(error);

            this.send(`/${channel} [ERROR] ${error}`);
        }
    }
}

module.exports = MutationCommand;
