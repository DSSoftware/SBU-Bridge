const { getLatestProfile } = require('../../../API/functions/getLatestProfile.js');
const { uploadImage } = require('../../contracts/API/imgurAPI.js');
const { decodeData, formatUsername } = require('../../contracts/helperFunctions.js');
const config = require('#root/config.js').getConfig();
const minecraftCommand = require('../../contracts/minecraftCommand.js');
const { renderLore } = require('../../contracts/renderItem.js');

class EquipmentCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'equipment';
        this.aliases = ['eq'];
        this.description = 'Renders equipment of specified user.';
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

            const profile = await getLatestProfile(username);

            username = formatUsername(username, profile.profileData?.game_mode);

            if (profile.profile?.inventory?.equipment_contents?.data === undefined) {
                return this.send(`/${channel} This player has an Inventory API off.`);
            }

            const { i: inventoryData } = await decodeData(
                Buffer.from(profile.profile.inventory.equipment_contents.data, 'base64')
            );

            let response = '';
            let images = '';
            let img_array = [];
            let armor_pieces = '';

            for (const piece of Object.values(inventoryData)) {
                if (piece?.tag?.display?.Name === undefined || piece?.tag?.display?.Lore === undefined) {
                    continue;
                }

                const Name = piece?.tag?.display?.Name;
                const Lore = piece?.tag?.display?.Lore;

                const renderedItem = await renderLore(Name, Lore);

                const upload = await uploadImage(renderedItem);
                img_array.push(renderedItem);

                const link = upload.data.link;

                images += `\n${link}`;
                armor_pieces += `[${Name.replace(/§[0-9A-FK-OR]/gi, '')}] `;

                response += response.split(' | ').length == 4 ? link : `${link} | `;
            }

            if (!config.minecraft.commands.integrate_images) {
                this.send(`/${channel} ${username}'s Equipment: ${armor_pieces}. Full response in Discord.`);

                this.sendDiscordFollowup(channel, images, img_array);
                return;
            }

            this.send(`/${channel} ${username}'s Equipment: ${response}`);
        } catch (error) {
            this.send(`/${channel} [ERROR] ${error}`);
        }
    }
}

module.exports = EquipmentCommand;
