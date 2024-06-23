const config = require('../../../config.js');
const { ImgurClient } = require('imgur');

const imgurClient = new ImgurClient({
    accessToken: config.minecraft.API.imgurAPIkey
});

async function uploadImage(image) {
    if(!config.minecraft.API.useImgur){
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
        console.log(response);
        // eslint-disable-next-line no-throw-literal
        throw 'An error occured while uploading the image. Please try again later.';
    }

    return response;
}

module.exports = { uploadImage };
