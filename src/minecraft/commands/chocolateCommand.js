const minecraftCommand = require("../../contracts/minecraftCommand.js");
const { getUUID } = require("../../contracts/API/PlayerDBAPI.js");
const axios = require("axios");
const config = require("../../../config.js");
const { formatNumber, formatUsername } = require("../../contracts/helperFunctions.js");

class topCommand extends minecraftCommand {
  constructor(minecraft) {
    super(minecraft);

    this.name = "chocolate";
    this.aliases = ["cf", "hoppity", "choc"];
    this.description = "Sends your Chocolate Factory stats";
    this.options = [
      {
        name: "username",
        description: "Minecraft username",
        required: false,
      },
    ];
  }

  async onCommand(username, message, channel = "gc") {
    try {
      let passed_username = this.getArgs(message)[0];
      username = passed_username || username;
      const player_uuid = await getUUID(username);

      let player_profile = `https://api.hypixel.net/v2/skyblock/profiles?key=${config.minecraft.API.hypixelAPIkey}&uuid=${player_uuid}`;

      let player_data = await Promise.all([
        axios.get(player_data)
      ]).catch((error) => {
        throw "Player has no SkyBlock profiles."
      });

      player_data = player_data[0].data ?? {};
      if(!player_data?.success){
        throw "Player has no SkyBlock profiles."
      }

      let selected_profile = null;

      for(let profile of (player_data?.profiles ?? [])){
        if(profile?.selected == true){
          selected_profile = profile?.members?.[player_uuid];
        }
      }

      if(selected_profile == null || selected_profile == undefined){
        throw "Player has no selected profile.";
      }

      let easter_stats = selected_profile?.events?.easter;

      if(easter_stats == undefined){
        throw "Player hasn't participated in the easter event.";
      }

      let chocolate = easter_stats?.chocolate ?? 0;
      let chocolate_since_prestige = easter_stats?.chocolate_since_prestige ?? 0;
      let total_chocolate = easter_stats?.total_chocolate ?? 0;
      let rabbits = easter_stats?.rabbits ?? {};
      let employees = easter_stats?.employees;
      let prestige = easter_stats?.chocolate_level ?? 0;    
      
      let barn_capacity = easter_stats?.rabbit_barn_capacity_level ?? 0;
      let click_upgrades = easter_stats?.click_upgrades ?? 0;
      let time_tower = easter_stats?.time_tower?.level ?? 0;
      let shrine = easter_stats?.rabbit_rarity_upgrades ?? 0;
      let fourth_perk = 0;

      this.send(
        `/${channel} ${username}'s Factory: Prestige: ${prestige ?? 0} | ${rabbits.length ?? 0}/395 Rabbits | Ch. Current: ${formatNumber(chocolate)} (Prestige: ${formatNumber(chocolate_since_prestige)}) (Total: ${formatNumber(total_chocolate)}) | Employees: [${employees?.rabbit_bro ?? 0}] [${employees?.rabbit_cousin ?? 0}] [${employees?.rabbit_sis ?? 0}] [${employees?.rabbit_father ?? 0}] [${employees?.rabbit_grandma ?? 0}] | Barn ${barn_capacity} | Upgrades ${click_upgrades}-${time_tower}-${shrine}-${fourth_perk}`,
      );
    } catch (error) {
      console.log(error);
      this.send(`/${channel} [ERROR] ${error}`);
    }
  }
}

module.exports = topCommand;
