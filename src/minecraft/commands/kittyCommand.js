const minecraftCommand = require('../../contracts/minecraftCommand.js');
const { uploadImage } = require('../../contracts/API/imgurAPI.js');
const axios = require('axios');
const config = require('#root/config.js').getConfig();

class KittyCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'kitty';
        this.aliases = ['cat', 'cutecat'];
        this.description = 'Random image of cute cat.';
        this.options = [];
    }

    async onCommand(username, message, channel = 'gc') {
        try {
            if (!config.minecraft.commands.integrate_images) {
                this.send(`/${channel} Blame Hypixel for banning cute cat images :sob:`);
                return;
            }
            const { data } = await axios.get(`https://api.thecatapi.com/v1/images/search`);

            if (data === undefined) {
                // eslint-disable-next-line no-throw-literal
                throw 'An error occured while fetching the image. Please try again later.';
            }

            const link = data[0].url;
            const upload = await uploadImage(link);

            this.send(`/${channel} Cute Cat: ${upload.data.link}`);
        } catch (error) {
            this.send(`/${channel} [ERROR] ${error ?? 'Something went wrong..'}`);
        }
    }
}

module.exports = KittyCommand;
