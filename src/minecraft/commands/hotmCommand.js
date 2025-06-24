const minecraftCommand = require('../../contracts/minecraftCommand.js');
const { getLatestProfile } = require('../../../API/functions/getLatestProfile.js');
const HOTM = require('../../../API/constants/hotm.js');
const config = require('#root/config.js').getConfig();
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

        this.name = 'hotm';
        this.aliases = ['heart', 'mining'];
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

    async getPowderInfo(type, display, color, data, just_powder = false) {
        let powder_spent = data?.[`powder_spent_${type}`] ?? 0;
        let powder_available = data?.[`powder_${type}`] ?? 0;

        let total_powder = powder_spent + powder_available;

        let response = `${color}${display} §7Powder: ${color}${formatNumber(total_powder)} §7Available: ${color}${formatNumber(powder_available)}`;

        if (just_powder) {
            return formatNumber(total_powder);
        }

        return response;
    }

    async getNucleusRuns(data) {
        let jade_places = data?.crystals?.jade_crystal?.total_placed ?? 0;
        let amber_places = data?.crystals?.amber_crystal?.total_placed ?? 0;
        let topaz_places = data?.crystals?.topaz_crystal?.total_placed ?? 0;
        let sapphire_places = data?.crystals?.sapphire_crystal?.total_placed ?? 0;
        let amethyst_places = data?.crystals?.amethyst_crystal?.total_placed ?? 0;

        let runs = Math.min(jade_places, amber_places, topaz_places, sapphire_places, amethyst_places);

        return runs;
    }

    async getHOTMTree(layer, data, hotm_lvl = 0) {
        let hotm_tree = HOTM.tree;
        let hotm_nodes = HOTM.nodes;

        let hotm_symbols = '';
        let hotm_names = '';

        for (let node of hotm_tree?.[layer]) {
            if (node == null) {
                hotm_symbols += ' §0|      ';
                hotm_names += ' §0|      ';
                continue;
            }
            let level = data?.nodes?.[node] ?? 0;
            let hotm_node = new hotm_nodes[node]({ level: level });

            let symbol = hotm_node.nodeSymbol;
            let color = hotm_node.color;

            if (layer > hotm_lvl) {
                color = 'c';
                symbol = '-';
            }
            let name = `§${color}` + hotm_node.displayName;

            let proper_node = `§${color}${symbol} §${color}${level}`;
            let pn_pars = (proper_node.match(/§/g) || []).length;
            proper_node = proper_node.padEnd(7 + pn_pars, ' ');
            name = name.padEnd(7, ' ');

            hotm_symbols += ' §0| ' + proper_node;
            hotm_names += ' §0| ' + name;
        }

        hotm_symbols = (hotm_symbols + ' §0|').replace(/ /g, '§7 ');
        hotm_names = (hotm_names + ' §0|').replace(/ /g, '§7 ');

        return [` §0${'⎯'.repeat(77)} `, hotm_symbols, hotm_names];
    }

    async onCommand(username, message, channel = 'gc') {
        try {
            username = this.getArgs(message)[0] || username;
            const data = await getLatestProfile(username);
            username = formatUsername(username, data.profileData?.game_mode);

            let hotm_data = data?.profile?.mining_core;

            if (hotm_data == undefined || Object.keys(hotm_data?.nodes ?? {}).length == 0) {
                throw 'Player has no HOTM data.';
            }

            let hotm_exp = Math.floor(hotm_data?.experience);
            let hotm_level_data = await this.getHOTMLevel(hotm_exp);
                
            let mithril_powder = await this.getPowderInfo('mithril', 'Mithril', '§2', hotm_data, true);
            let gemstone_powder = await this.getPowderInfo('gemstone', 'Gemstone', '§d', hotm_data, true);
            let glacite_powder = await this.getPowderInfo('glacite', 'Glacite', '§b', hotm_data, true);

            let xp_left = `(${formatNumber(hotm_level_data?.xp_left)} / ${formatNumber(hotm_level_data?.xp_to_next)} EXP | Total: ${formatNumber(hotm_exp)} EXP)`;
            if(hotm_level_data?.next_level == null){
                xp_left = "(MAX)";
            }

            let nucleus_runs = await this.getNucleusRuns(hotm_data);

            this.send(
                `/${channel} ${username} HOTM Level: ${hotm_level_data?.level} ${xp_left} | Powder: ${mithril_powder} Mithril | ${gemstone_powder} Gemstone | ${glacite_powder} Glacite. ${nucleus_runs} Nucleus Runs completed.`
            );
        } catch (error) {
            Logger.warnMessage(error);
            this.send(`/${channel} [ERROR] ${error}`);
        }
    }
}

module.exports = MedalsCommand;
