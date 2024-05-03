const axios = require("axios");
const config = require("../../../config");

const cache = new Map();

async function getUUID(username, full = false) {
  try {
    if (cache.has(username)) {
      const data = cache.get(username.toLowerCase());

      if (data.last_save + 43200000 > Date.now()) {
        if (full) {
          return {
            uuid: data.id,
            username: data.name,
          };
        }

        return data.id;
      }
    }

    let uuid = null;
    let ign = null;

    if(config.minecraft.API.mojang_resolver){
      const { data } = await axios.get(`https://api.minecraftservices.com/minecraft/profile/lookup/name/${username}`);

      if (data.errorMessage || data.id === undefined) {
        throw data.errorMessage ?? "Invalid username.";
      }

      uuid = data.id;
      ign = data.name;
    }
    else{
      const { data } = await axios.get(`https://mojang.dssoftware.ru/?nick=${username}`);

      if (data.success == false || data.id === null) {
        throw "Invalid username.";
      }

      uuid = data.id;
      ign = data.name;
    }

    if(uuid == null || ign == null){
      throw "Invalid username.";
    }

    let correct_uuid = uuid.replace(/-/g, "");

    cache.set(ign.toLowerCase(), {
      last_save: Date.now(),
      id: correct_uuid,
      name: ign
    });

    if (full) {
      return {
        uuid: correct_uuid,
        username: ign,
      };
    }
    return correct_uuid;
  } catch (error) {
    console.log(error);
    const err = error?.response?.status ?? "Invalid username.";
    if (err == 404) {
      throw "Invalid username.";
    }
    if (err == 403) {
      throw "Request was blocked.";
    }
    if (err == 400) {
      throw "Malformed username.";
    }
    if (err == 429) {
      throw "Too many requests.";
    }
    throw `Code: ${err}`;
  }
}

async function getUsername(uuid) {
  try {
    const { data } = await axios.get(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`);
    return data.name;
  } catch (error) {
    console.log(error);
  }
}

async function resolveUsernameOrUUID(username) {
  try {
    return getUUID(username, true);
  } catch (error) {
    console.log(error);
  }
}

module.exports = { getUUID, getUsername, resolveUsernameOrUUID };
