const minecraftCommand = require('../../contracts/minecraftCommand.js');
const { formatUsername } = require('../../contracts/helperFunctions.js');
const { renderLore } = require('../../contracts/renderItem.js');
const { uploadImage } = require('../../contracts/API/imgurAPI.js');
const config = require('#root/config.js').getConfig();
const Logger = require('#root/src/Logger.js');
const { CROP_IDS_MAP, CROP_MILESTONE_CAPS, PERSONAL_BEST_FF_AMOUNTS } = require('../../../API/constants/garden.js');
const { resolveGardenContext, parseCropInput, formatNumber } = require('../other/gardenHelper.js');

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

class CropCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'crop';
        this.aliases = ['c'];
        this.description = 'Shows specific crop progress.';
        this.options = [
            {
                name: 'username',
                description: 'Minecraft username',
                required: false
            },
            {
                name: 'crop',
                description: 'Crop name',
                required: false
            }
        ];
    }

    async onCommand(username, message, channel = 'gc') {
        try {
            const args = this.getArgs(message).filter((arg) => arg !== '');

            let targetUsername = username;
            let cropInput = 'WHEAT';

            if (args.length === 1) {
                const parsedCrop = parseCropInput(args[0]);
                if (parsedCrop) {
                    cropInput = parsedCrop;
                } else {
                    targetUsername = args[0];
                }
            } else if (args.length >= 2) {
                targetUsername = args[0];
                const cropFromRemainingArgs = parseCropInput(args.slice(1).join(' '));
                cropInput = cropFromRemainingArgs ?? parseCropInput(args[1]) ?? args[1].toUpperCase();
            }

            const normalizedCrop = parseCropInput(cropInput);
            if (!normalizedCrop) {
                throw `Invalid crop. Use: ${Object.keys(CROP_IDS_MAP).join(', ')}`;
            }

            const context = await resolveGardenContext(targetUsername);
            const displayName = formatUsername(context.username, context.profileData?.game_mode);

            const member = context.memberData ?? {};
            const garden = context.gardenData ?? {};
            const cropId = CROP_IDS_MAP[normalizedCrop];

            const gardenCollection = garden?.resources_collected?.[cropId] ?? 0;
            const totalCollection = member?.collection?.[cropId] ?? 0;
            const milestoneCap = CROP_MILESTONE_CAPS[normalizedCrop] ?? 0;
            const milestonePercent = milestoneCap > 0
                ? Math.min((gardenCollection / milestoneCap) * 100, 100)
                : null;

            const jacobsContests = member?.jacobs_contest?.contests ?? {};
            let personalBest = 0;
            for (const [contestKey, contestData] of Object.entries(jacobsContests)) {
                if (contestKey.endsWith(`:${cropId}`) || contestKey.endsWith(cropId)) {
                    personalBest = Math.max(personalBest, contestData?.collected ?? 0);
                }
            }

            const ffDivisor = PERSONAL_BEST_FF_AMOUNTS[cropId] ?? 0;
            const pbFF = ffDivisor > 0 ? ((personalBest / ffDivisor) * 0.1).toFixed(2) : '0.00';

            const cropLabel = toTitleCaseCrop(normalizedCrop);
            const milestoneText = milestoneCap > 0
                ? `${formatNumber(gardenCollection)}/${formatNumber(milestoneCap)} (${milestonePercent.toFixed(2)}%)`
                : 'N/A';
            const summary = `${displayName}'s ${cropLabel} (${context.profileData?.cute_name}) | Milestone ${milestoneText} | PB ${formatNumber(personalBest)} | Garden ${formatNumber(gardenCollection)} | Total ${formatNumber(totalCollection)}`;

            const lore = [
                `§7Profile: §a${context.profileData?.cute_name ?? 'Unknown'}`,
                `§7Crop: §e${cropLabel}`,
                `§7Milestone Progress: §b${milestoneText}`,
                `§7Garden Collection: §a${formatNumber(gardenCollection)}`,
                `§7Overall Collection: §6${formatNumber(totalCollection)}`,
                `§7Personal Best: §d${formatNumber(personalBest)}`,
                `§7PB Farming Fortune: §e+${pbFF}`
            ];

            const renderedItem = await renderLore(`§6${displayName}'s ${cropLabel}`, lore);
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

module.exports = CropCommand;