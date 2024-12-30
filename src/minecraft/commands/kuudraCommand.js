const minecraftCommand = require('../../contracts/minecraftCommand.js');
const { getLatestProfile } = require('../../../API/functions/getLatestProfile.js');
const HOTM = require('../../../API/constants/hotm.js');
const config = require('../../../config.js');
const { formatUsername } = require('../../contracts/helperFunctions.js');
const { renderLore } = require('../../contracts/renderItem.js');
const { uploadImage } = require('../../contracts/API/imgurAPI.js');
const Logger = require('#root/src/Logger.js');

function formatNumber(x) {
    return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',');
}

class MedalsCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'kuudra';
        this.aliases = [];
        this.description = "Shows player's Kuudra stats.";
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

            let kuudra_data = data?.profile?.nether_island_player_data?.kuudra_completed_tiers;

            if (kuudra_data == undefined) {
                throw 'Player has no Kuudra runs!';
            }

            let basic_runs = parseInt(kuudra_data.none) || 0;
            let hot_runs = parseInt(kuudra_data.hot) || 0;
            let burning_runs = parseInt(kuudra_data.burning) || 0;
            let fiery_runs = parseInt(kuudra_data.fiery) || 0;
            let infernal_runs = parseInt(kuudra_data.infernal) || 0;

            let infernal_wave = parseInt(kuudra_data.highest_wave_infernal) || "N/A";

            let kuudra_score = basic_runs + 2 * hot_runs + 3 * burning_runs + 4 * fiery_runs + 5 * infernal_runs;
            let kuudra_runs = basic_runs + hot_runs + burning_runs + fiery_runs + infernal_runs;

            this.send(
                `/${channel} ${username} Kuudra Runs: ${kuudra_runs} | ${kuudra_score} Score (Ba: ${basic_runs} | H: ${hot_runs} | Bu: ${burning_runs} | F: ${fiery_runs} | I: ${infernal_runs}). Highest Infernal Wave: ${infernal_wave}.`
            );
        } catch (error) {
            Logger.warnMessage(error);
            this.send(`/${channel} [ERROR] ${error}`);
        }
    }
}

module.exports = MedalsCommand;
