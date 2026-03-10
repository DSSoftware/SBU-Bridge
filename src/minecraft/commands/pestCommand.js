const minecraftCommand = require('../../contracts/minecraftCommand.js');
const { formatUsername } = require('../../contracts/helperFunctions.js');
const { renderLore } = require('../../contracts/renderItem.js');
const { uploadImage } = require('../../contracts/API/imgurAPI.js');
const config = require('#root/config.js').getConfig();
const Logger = require('#root/src/Logger.js');
const { GARDEN_PESTS_CONFIG } = require('../../../API/constants/garden.js');
const { resolveGardenContext, formatNumber } = require('../other/gardenHelper.js');

class PestCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'pest';
        this.aliases = ['pests'];
        this.description = 'Shows Garden pest statistics.';
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

            const member = context.memberData ?? {};
            const gardenMember = member.garden_player_data ?? {};
            const bestiaryKills = member?.bestiary?.kills ?? {};

            const pestDetails = Object.values(GARDEN_PESTS_CONFIG).map((pest) => {
                const totalKills = Object.entries(bestiaryKills)
                    .filter(([key]) => key.toLowerCase().startsWith(pest.api_id_pattern.toLowerCase()))
                    .reduce((sum, [, kills]) => sum + (typeof kills === 'number' ? kills : 0), 0);

                return {
                    name: pest.name,
                    kills: totalKills,
                    maxed: totalKills >= pest.max_tier_kills
                };
            });

            const maxedCount = pestDetails.filter((pest) => pest.maxed).length;
            const larvaConsumed = gardenMember.larva_consumed ?? 0;
            const topPests = [...pestDetails].sort((a, b) => b.kills - a.kills).slice(0, 3);

            const summary = `${displayName}'s Pests (${context.profileData?.cute_name}) | Maxed ${maxedCount}/${pestDetails.length} | Larva ${formatNumber(larvaConsumed)} | Top ${topPests.map((p) => `${p.name} ${formatNumber(p.kills)}`).join(', ')}`;

            const lore = [
                `§7Profile: §a${context.profileData?.cute_name ?? 'Unknown'}`,
                `§7Maxed Pests: §e${maxedCount}§7/${pestDetails.length}`,
                `§7Larva Consumed: §d${formatNumber(larvaConsumed)}`,
                '§f',
                ...pestDetails
                    .sort((a, b) => b.kills - a.kills)
                    .map((pest) => `§7${pest.name}: ${pest.maxed ? '§a' : '§c'}${formatNumber(pest.kills)}`)
            ];

            const renderedItem = await renderLore(`§c${displayName}'s Pests`, lore);
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

module.exports = PestCommand;