const config = require("../../config.js");
const axios = require("axios");

const sender_cache = new Map();

async function getLockState(uuid) {
  return new Promise(async (resolve, reject) => {
    if (!config.minecraft.API.SCF.enabled) {
      resolve(false);
      return;
    }
    
    let player_banned = await Promise.all([
      axios.get(
        `https://sky.dssoftware.ru/api.php?method=isBridgeLocked&uuid=${uuid}&api=${config.minecraft.API.SCF.key}`,
      ),
    ]).catch((error) => {
      resolve(false);
    });

    player_banned = player_banned[0]?.data ?? {};
    
    resolve(player_banned?.data?.locked === true);
  });
}

async function checkBridgelock(uuid) {
  return new Promise(async (resolve, reject) => {
    if (sender_cache.has(uuid)) {
      const data = sender_cache.get(uuid);

      if (data.last_save + 60000 > Date.now()) {
        resolve(data.locked);
        return;
      }
    }

    getLockState(uuid).then((response)=>{
      sender_cache.set(uuid, {
        last_save: Date.now(),
        locked: response,
      });
  
      resolve(response);
    }, ()=>{
      resolve(false);
    });
  });
}

module.exports = {
  checkBridgelock,
};
