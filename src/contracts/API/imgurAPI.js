const config = require("../../../config.js");
const { ImgurClient } = require("imgur");

const imgurClient = new ImgurClient({
  accessToken: config.minecraft.API.imgurAPIkey,
});

async function uploadImage(image) {
  throw "Imgur uploads are temporary disabled.";
  const response = await imgurClient.upload({
    image: image,
  });

  if (response.success === false) {
    // eslint-disable-next-line no-throw-literal
    throw "An error occured while uploading the image. Please try again later.";
  }

  return response;
}

module.exports = { uploadImage };
