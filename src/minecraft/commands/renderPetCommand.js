const { getRarityColor, formatUsername } = require('../../contracts/helperFunctions.js');
const minecraftCommand = require('../../contracts/minecraftCommand.js');
const { renderLore } = require('../../contracts/renderItem.js');
const { getLatestProfile } = require('../../../API/functions/getLatestProfile.js');
const getPets = require('../../../API/stats/pets.js');
const config = require('../../../config.js');
const { uploadImage } = require('../../contracts/API/imgurAPI.js');
const Logger = require('#root/src/Logger.js');

class RenderCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'pet';
        this.aliases = ['pets'];
        this.description = 'Renders active pet of specified user.';
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

            const profile = getPets(data.profile);

            const pet = profile.pets.find((pet) => pet.active === true);

            if (pet === undefined) {
                return this.send(`/${channel} ${username} does not have pet equiped.`);
            }

            const renderedItem = await renderLore(
                `§7[Lvl ${pet.level}] §${getRarityColor(pet.tier)}${pet.display_name}`,
                pet.lore
            );

            const upload = await uploadImage(renderedItem);

            if (!config.minecraft.commands.integrate_images) {
                this.send(
                    `/${channel} ${username}'s pet is [Lvl ${pet.level}] ${pet.tier} ${pet.display_name}. Full response in Discord.`
                );

                this.sendDiscordFollowup(channel, upload.data.link, [renderedItem]);
                return;
            }

            return this.send(`/${channel} ${username}'s Active Pet: ${upload.data.link ?? 'Something went Wrong..'}`);
        } catch (error) {
            Logger.warnMessage(error);
            this.send(`/${channel} [ERROR] ${error}`);
        }
    }
}

module.exports = RenderCommand;
