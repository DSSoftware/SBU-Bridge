const minecraftCommand = require('../../contracts/minecraftCommand.js');
const { getLatestProfile } = require('../../../API/functions/getLatestProfile.js');
const { formatUsername } = require('../../contracts/helperFunctions.js');

class FairySoulsCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'fairysouls';
        this.aliases = ['fs'];
        this.description = 'Fairy Souls of specified user.';
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
            username = formatUsername(username, data.profileData.game_mode);

            const total = data.profileData.game_mode === 'island' ? 5 : 247;

            const { fairy_soul } = data.profile;

            const fairy_souls_collected = fairy_soul.total_collected;

            this.send(
                `/${channel} ${username}'s Fairy Souls: ${fairy_souls_collected}/${total} | Progress: ${(
                    (fairy_souls_collected / total) *
                    100
                ).toFixed(2)}%`
            );
        } catch (error) {
            this.send(`/${channel} [ERROR] ${error}`);
        }
    }
}

module.exports = FairySoulsCommand;
