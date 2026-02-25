const minecraftCommand = require('../../contracts/minecraftCommand.js');
const { formatUsername } = require('../../contracts/helperFunctions.js');
const { getLatestProfile } = require('../../../API/functions/getLatestProfile.js');
const Logger = require('#root/src/Logger.js');

function formatNumber(x) {
    return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',');
}

class Hotm2Command extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'hotm2';
        this.aliases = ['heart2', 'mining2'];
        this.description = "Shows player's HOTM stats.";
        this.options = [
            {
                name: 'username',
                description: 'Minecraft username',
                required: false
            }
        ];
    }

    async getHOTMLevel(experience) {
        const HOTM_XP = {
            1: 0,
            2: 3000,
            3: 9000,
            4: 25000,
            5: 60000,
            6: 100000,
            7: 150000,
            8: 210000,
            9: 290000,
            10: 400000
        };

        let left_exp = experience;

        let level = 0;
        let xp_remaining = 0;
        let xp_to_next = 0;
        let next_level = null;

        for (let level_info of Object.entries(HOTM_XP)) {
            let hotm_level = level_info[0];
            let hotm_exp = level_info[1];

            if (left_exp >= hotm_exp) {
                left_exp -= hotm_exp;
                level = hotm_level;
            } else {
                xp_remaining = left_exp;
                next_level = hotm_level;
                xp_to_next = hotm_exp;
                break;
            }
        }

        return {
            level: level,
            next_level: next_level,
            xp_left: xp_remaining,
            xp_to_next: xp_to_next
        };
    }

    async onCommand(username, message, channel = 'gc') {
        try {
            username = this.getArgs(message)[0] || username;

            const data = await getLatestProfile(username);

            username = formatUsername(username, data.profileData?.game_mode);

            let hotm_xp = data?.v2?.profile?.skill_tree.experience.mining;
            let hotm_level_data = await this.getHOTMLevel(hotm_xp);

            let cotm = data?.v2?.profile?.skill_tree.nodes.mining.core_of_the_mountain;

            let mithril_powder = data?.v2?.profile?.mining_core.powder_mithril + data?.v2?.profile?.mining_core.powder_spent_mithril;
            let gemstone_powder = data?.v2?.profile?.mining_core.powder_gemstone + data?.v2?.profile?.mining_core.powder_spent_gemstone;
            let glacite_powder = data?.v2?.profile?.mining_core.powder_glacite + data?.v2?.profile?.mining_core.powder_spent_glacite;

            mithril_powder = formatNumber(mithril_powder);
            gemstone_powder = formatNumber(gemstone_powder);
            glacite_powder = formatNumber(glacite_powder);

            let xp_left = `(${formatNumber(hotm_level_data?.xp_left)} / ${formatNumber(hotm_level_data?.xp_to_next)} EXP | Total: ${formatNumber(hotm_xp)} EXP)`;
            if(hotm_level_data?.next_level == null){
                xp_left = "(MAX)";
            }

            this.send(
                `/${channel} ${username} HOTM Level: ${hotm_level_data?.level} ${xp_left} | COTM: ${cotm} | Powder: ${mithril_powder} Mithril | ${gemstone_powder} Gemstone | ${glacite_powder} Glacite.`
            );
        } catch (error) {
            Logger.warnMessage(error);
            this.send(`/${channel} [ERROR] ${error}`);
        }
    }
}

module.exports = Hotm2Command;
