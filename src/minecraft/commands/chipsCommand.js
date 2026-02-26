const minecraftCommand = require('../../contracts/minecraftCommand.js');
const { formatNumber, formatUsername } = require('../../contracts/helperFunctions.js');
const { getLatestProfile } = require('../../../API/functions/getLatestProfile.js');
const Logger = require('#root/src/Logger.js');

class ChipsCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'chips';
        this.aliases = ['chips'];
        this.description = 'Shows the Farming Chips of a User.';
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
            username = formatUsername(username, data.profileData?.game_mode);

            const gardenChips = data?.v2?.profile?.player_data?.garden_chips || {};

            let cropshot = gardenChips.cropshot ?? 0;
            let hypercharge = gardenChips.hypercharge ?? 0;
            let quickdraw = gardenChips.quickdraw ?? 0;
            let vermin = gardenChips.vermin_vaporizor ?? 0;
            let rarefinder = gardenChips.rarefinder ?? 0;
            let mechamind = gardenChips.mechamind ?? 0;
            let synthesis = gardenChips.synthesis ?? 0;
            let evergreen = gardenChips.evergreen ?? 0;
            let overdrive = gardenChips.overdrive ?? 0;
            let sowledge = gardenChips.sowledge ?? 0;


            this.send(
                `/${channel} ${username} has following Chips: Cropshot: ${cropshot} | Hypercharge: ${hypercharge} | Quickdraw: ${quickdraw} | Vermin Vaporizor: ${vermin} | Rarefinder: ${rarefinder} | Mechamind: ${mechamind} | Synthesis: ${synthesis} | Evergreen: ${evergreen} | Overdrive: ${overdrive} | Sowledge: ${sowledge} `
            );
        } catch (error) {
            Logger.warnMessage(error);

            this.send(`/${channel} [ERROR] ${error}`);
        }
    }
}

module.exports = ChipsCommand;
