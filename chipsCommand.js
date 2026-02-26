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

            let cropshot = data?.v2?.profile?.player_data.garden_chips.cropshot;
            let hypercharge = data?.v2?.profile?.player_data.garden_chips.hypercharge;
            let quickdraw = data?.v2?.profile?.player_data.garden_chips.quickdraw;
            let vermin = data?.v2?.profile?.player_data.garden_chips.vermin_vaporizor;
            let rarefinder = data?.v2?.profile?.player_data.garden_chips.rarefinder;
            let mechamind = data?.v2?.profile?.player_data.garden_chips.mechamind;
            let synthesis = data?.v2?.profile?.player_data.garden_chips.synthesis;
            let evergreen = data?.v2?.profile?.player_data.garden_chips.evergreen;
            let overdrive = data?.v2?.profile?.player_data.garden_chips.overdrive;
            let sowledge = data?.v2?.profile?.player_data.garden_chips.sowledge;


            this.send(
                `/${channel} ${username} Chips: Cropshot: ${cropshot} | Hypercharge: ${hypercharge} | Quickdraw: ${quickdraw} | Vermin Vaporizor: ${vermin} | Rarefinder: ${rarefinder} | Mechamind: ${mechamind} | Synthesis: ${synthesis} | Evergreen: ${evergreen} | Overdrive: ${overdrive} | Sowledge: ${sowledge} `
            );
        } catch (error) {
            Logger.warnMessage(error);

            this.send(`/${channel} [ERROR] ${error}`);
        }
    }
}

module.exports = ChipsCommand;
