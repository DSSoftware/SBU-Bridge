const { decodeData, formatUsername } = require('../../contracts/helperFunctions.js');
const { getLatestProfile } = require('../../../API/functions/getLatestProfile.js');
const config = require('#root/config.js').getConfig();
const minecraftCommand = require('../../contracts/minecraftCommand.js');
const { uploadImage } = require('../../contracts/API/imgurAPI.js');
const { renderLore } = require('../../contracts/renderItem.js');

class ArmorCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'armor';
        this.aliases = ['armour'];
        this.description = 'Renders armor of specified user.';
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

            if (profile.profile?.inventory.inv_armor?.data === undefined) {
                return this.send(`/${channel} This player has an Inventory API off.`);
            }

            const { i: inventoryData } = await decodeData(Buffer.from(profile.profile.inventory.inv_armor.data, 'base64'));

            if (
                inventoryData === undefined ||
                inventoryData.filter((x) => JSON.stringify(x) === JSON.stringify({})).length === 4
            ) {
                return this.send(`/${channel} ${username} has no armor equipped.`);
            }

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
                this.send(`/${channel} ${username}'s Armor: ${armor_pieces}. Full response in Discord.`);

                this.sendDiscordFollowup(channel, images, img_array);
                return;
            }

            this.send(`/${channel} ${username}'s Armor: ${response}`);
        } catch (error) {
            this.send(`/${channel} [ERROR] ${error}`);
        }
    }
}

module.exports = ArmorCommand;
