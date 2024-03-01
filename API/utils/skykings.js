const config = require("../../config.js");
const Logger = require("../../src/Logger.js");
const axios = require("axios");

const key = config.minecraft.API.skykingsAPIkey;

async function lookupUUID(uuid) {
  return new Promise(async (resolve, reject) => {
    if (config.minecraft.API.banlist.skykings === false) {
      resolve(false);
      return;
    }
    try {
      const response = await axios.get(`https://skykings.net/api/lookup?key=${key}&uuid=${uuid}`);
      resolve(response.data.entries.length > 0);
    } catch (error) {
      await Logger.errorMessage(error.message);
      throw error;
    }
  });
}

module.exports = {
  lookupUUID,
};
