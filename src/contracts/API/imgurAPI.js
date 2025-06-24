const config = require('#root/config.js').getConfig();
const { ImgurClient } = require('imgur');
const Logger = require('#root/src/Logger.js');

const imgurClient = new ImgurClient({
    accessToken: config.API.imgurAPIkey
});

async function uploadImage(image) {
    if(!config.minecraft.commands.integrate_images){
        return {
            data: {
                link: ''
            }
        };
    }
    const response = await imgurClient.upload({
        image: image
    });

    if (response.success === false) {
        Logger.warnMessage(response);
        // eslint-disable-next-line no-throw-literal
        throw 'An error occured while uploading the image. Please try again later.';
    }

    return response;
}

module.exports = { uploadImage };
