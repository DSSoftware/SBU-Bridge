const minecraftCommand = require('../../contracts/minecraftCommand.js');
const { formatUsername } = require('../../contracts/helperFunctions.js');
const { renderLore } = require('../../contracts/renderItem.js');
const { uploadImage } = require('../../contracts/API/imgurAPI.js');
const config = require('#root/config.js').getConfig();
const Logger = require('#root/src/Logger.js');
const { resolveGardenContext, getGardenLevelFromXP, formatNumber } = require('../other/gardenHelper.js');

class GardenCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'garden';
        this.aliases = ['g'];
        this.description = 'Shows Garden overview.';
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
            const args = this.getArgs(message).filter((arg) => arg !== '');
            const targetUsername = args[0] || username;

            const context = await resolveGardenContext(targetUsername);
            const displayName = formatUsername(context.username, context.profileData?.game_mode);

            const garden = context.gardenData ?? {};
            const member = context.memberData ?? {};
            const gardenMember = member.garden_player_data ?? {};

            const gardenLevel = getGardenLevelFromXP(garden.garden_experience);
            const copper = gardenMember.copper ?? 0;
            const plotsUnlocked = (garden.unlocked_plots_ids ?? []).length;
            const larvaConsumed = gardenMember.larva_consumed ?? 0;

            const summary = `${displayName}'s Garden (${context.profileData?.cute_name}) | Lvl ${gardenLevel} | Copper ${formatNumber(copper)} | Plots ${plotsUnlocked}/24 | Larva ${formatNumber(larvaConsumed)}`;

            const lore = [
                `§7Profile: §a${context.profileData?.cute_name ?? 'Unknown'}`,
                `§7Garden Level: §e${gardenLevel}`,
                `§7Copper: §6${formatNumber(copper)}`,
                `§7Plots Unlocked: §b${plotsUnlocked}§7/24`,
                `§7Larva Consumed: §d${formatNumber(larvaConsumed)}`
            ];

            const renderedItem = await renderLore(`§a${displayName}'s Garden`, lore);
            const upload = await uploadImage(renderedItem);

            if (!config.minecraft.commands.integrate_images) {
                this.send(`/${channel} ${summary}. Full response in Discord.`);
                this.sendDiscordFollowup(channel, upload.data.link, [renderedItem]);
                return;
            }

            this.send(`/${channel} ${summary} | ${upload.data.link}`);
        } catch (error) {
            Logger.warnMessage(error);
            this.send(`/${channel} [ERROR] ${error}`);
        }
    }
}

module.exports = GardenCommand;