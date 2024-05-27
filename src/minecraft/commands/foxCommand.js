const minecraftCommand = require('../../contracts/minecraftCommand.js');
const { uploadImage } = require('../../contracts/API/imgurAPI.js');
const axios = require('axios');
const config = require('../../../config.js');

class FoxCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'fox';
        this.aliases = ['cutefox'];
        this.description = 'Random image of cute fox. Special thanks to 987654321Rui :)';
        this.options = [];
    }

    async onCommand(username, message, channel = 'gc') {
        try {
            if (!config.minecraft.commands.integrate_images) {
                this.send(`/${channel} Blame Hypixel for banning cute fox images :sob:`);
                return;
            }
            const { data } = await axios.get('https://randomfox.ca/floof/');

            if (data === undefined) {
                // eslint-disable-next-line no-throw-literal
                throw 'An error occured while fetching the image. Please try again later.';
            }

            const link = data.image;
            const upload = await uploadImage(link);

            this.send(`/${channel} Cute Fox: ${upload.data.link}`);
        } catch (error) {
            this.send(`/${channel} [ERROR] ${error ?? 'Something went wrong..'}`);
        }
    }
}

module.exports = FoxCommand;
