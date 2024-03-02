const config = require("../../config.js");
const axios = require("axios");

async function checkBlacklist(uuid) {
  return new Promise(async (resolve, reject) => {
    if (!config.minecraft.API.SCF.enabled) {
      resolve(false);
      return;
    }
    
    let player_banned = await Promise.all([
      axios.get(
        `https://sky.dssoftware.ru/api.php?method=isBanned&uuid=${uuid}&api=${config.minecraft.API.SCF.key}`,
      ),
    ]).catch((error) => {
      resolve(false);
    });

    player_banned = player_banned[0]?.data ?? {};
    
    resolve(player_banned.data === true);
  });
}

module.exports = {
  checkBlacklist,
};
