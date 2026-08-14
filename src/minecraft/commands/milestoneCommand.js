const minecraftCommand = require('../../contracts/minecraftCommand.js');
const { formatUsername } = require('../../contracts/helperFunctions.js');
const { renderLore } = require('../../contracts/renderItem.js');
const { uploadImage } = require('../../contracts/API/imgurAPI.js');
const config = require('#root/config.js').getConfig();
const Logger = require('#root/src/Logger.js');
const { CROP_IDS_MAP, CROP_MILESTONE_CAPS } = require('../../../API/constants/garden.js');
const { resolveGardenContext, formatNumber } = require('../other/gardenHelper.js');

const CROP_DISPLAY_NAME_OVERRIDES = {
    SUN_FLOWER: 'Sunflower'
};

function toTitleCaseCrop(cropName) {
    if (CROP_DISPLAY_NAME_OVERRIDES[cropName]) {
        return CROP_DISPLAY_NAME_OVERRIDES[cropName];
    }

    return cropName
        .toLowerCase()
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

class MilestonesCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'milestones';
        this.aliases = ['milestone', 'ms', 'cropmilestones'];
        this.description = 'Shows overall Garden crop milestone stats (maxed count & average).';
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

            const cropEntries = Object.entries(CROP_IDS_MAP);
            const totalCrops = cropEntries.length;

            if (totalCrops === 0) {
                throw 'No crops configured in CROP_IDS_MAP.';
            }

            let maxedCount = 0;
            let totalPercentage = 0;
            const cropBreakdown = [];

            for (const [cropKey, cropId] of cropEntries) {
                const gardenCollection = garden?.resources_collected?.[cropId] ?? 0;
                const milestoneCap = CROP_MILESTONE_CAPS[cropKey] ?? 0;

                let percent = 0;
                let isMaxed = false;

                if (milestoneCap > 0) {
                    percent = Math.min((gardenCollection / milestoneCap) * 100, 100);
                    if (gardenCollection >= milestoneCap) {
                        isMaxed = true;
                    }
                }

                if (isMaxed) {
                    maxedCount++;
                }

                totalPercentage += percent;

                cropBreakdown.push({
                    name: toTitleCaseCrop(cropKey),
                    collection: gardenCollection,
                    cap: milestoneCap,
                    percent,
                    isMaxed
                });
            }

            const milestoneAverage = totalPercentage / totalCrops;

            const summary = `${displayName}'s Crop Milestones (${context.profileData?.cute_name}) | Maxed: ${maxedCount}/${totalCrops} | Avg Progress: ${milestoneAverage.toFixed(2)}%`;

            const lore = [
                `§7Profile: §a${context.profileData?.cute_name ?? 'Unknown'}`,
                `§7Maxed Milestones: §e${maxedCount}§7/§e${totalCrops}`,
                `§7Milestone Average: §b${milestoneAverage.toFixed(2)}%`,
                `§7--------------------`
            ];

            for (const crop of cropBreakdown) {
                const statusColor = crop.isMaxed ? '§a' : '§e';
                const capText = crop.cap > 0 ? formatNumber(crop.cap) : 'N/A';
                lore.push(
                    `§7${crop.name}: ${statusColor}${crop.percent.toFixed(1)}% §7(${formatNumber(crop.collection)}/${capText})`
                );
            }

            const renderedItem = await renderLore(`§6${displayName}'s Garden Milestones`, lore);
            const upload = await uploadImage(renderedItem);

            const discordEmbedFields = cropBreakdown.map((crop) => {
                const capText = crop.cap > 0 ? formatNumber(crop.cap) : 'N/A';
                const statusIcon = crop.isMaxed ? '✅' : '⏳';

                return {
                    name: `${statusIcon} ${crop.name}`,
                    value: `**${crop.percent.toFixed(2)}%**\n\`${formatNumber(crop.collection)} / ${capText}\``,
                    inline: true
                };
            });

            const discordEmbed = {
                title: `${displayName}'s Crop Milestones`,
                description: `**Profile:** ${context.profileData?.cute_name ?? 'Unknown'}\n**Maxed Milestones:** ${maxedCount}/${totalCrops}\n**Average Progress:** ${milestoneAverage.toFixed(2)}%`,
                fields: discordEmbedFields,
                image: {
                    url: upload.data.link
                }
            };

            if (!config.minecraft.commands.integrate_images) {
                this.send(`/${channel} ${summary}. Full response in Discord.`);
                this.sendDiscordFollowup(channel, upload.data.link, [renderedItem], discordEmbed);
                return;
            }

            this.send(`/${channel} ${summary} | ${upload.data.link}`);
            this.sendDiscordFollowup(channel, upload.data.link, [renderedItem], discordEmbed);
        } catch (error) {
            Logger.warnMessage(error);
            this.send(`/${channel} [ERROR] ${error}`);
        }
    }
}

module.exports = MilestonesCommand;
