const minecraftCommand = require("../../contracts/minecraftCommand.js");
const { getLatestProfile } = require("../../../API/functions/getLatestProfile.js");
const { formatUsername } = require("../../contracts/helperFunctions.js");
const { renderLore } = require("../../contracts/renderItem.js");
const { uploadImage } = require("../../contracts/API/imgurAPI.js");

function formatNumber(x){
  return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
}

class MedalsCommand extends minecraftCommand {
  constructor(minecraft) {
    super(minecraft);

    this.name = "hotm";
    this.aliases = ["heart", "mining"];
    this.description = "Shows player's HOTM stats.";
    this.options = [
      {
        name: "username",
        description: "Minecraft username",
        required: false,
      },
    ];
  }

  async getHOTMLevel(experience){
    const HOTM_XP = {
      1: 0,
      2: 3000,
      3: 9000,
      4: 25000,
      5: 60000,
      6: 100000,
      7: 150000,
      8: 210000,
      9: 290000,
      10: 400000,
    };

    let left_exp = experience;

    let level = 0;
    let xp_remaining = 0;
    let xp_to_next = 0;
    let next_level = null;

    for(let level_info of Object.entries(HOTM_XP)){
      let hotm_level = level_info[0];
      let hotm_exp = level_info[1];

      if(left_exp >= hotm_exp){
        left_exp -= hotm_exp;
        level = hotm_level;
      }
      else{
        xp_remaining = left_exp;
        next_level = hotm_level;
        xp_to_next = hotm_exp;
        break;
      }
    }

    return {
      level: level,
      next_level: next_level,
      xp_left: xp_remaining,
      xp_to_next: xp_to_next
    };
  }

  async getPowderInfo(type, display, color, data){
    let powder_spent = data?.[`powder_spent_${type}`] ?? 0;
    let powder_available = data?.[`powder_${type}`] ?? 0;

    let total_powder = powder_spent + powder_available;

    let response = `${color}${display} §7Powder: ${color}${formatNumber(total_powder)} §7Available: ${color}${formatNumber(powder_available)}`;

    return response;
  }

  async getNucleusRuns(data){
    let jade_places = data?.crystals?.jade_crystal?.total_placed ?? 0;
    let amber_places = data?.crystals?.amber_crystal?.total_placed ?? 0;
    let topaz_places = data?.crystals?.topaz_crystal?.total_placed ?? 0;
    let sapphire_places = data?.crystals?.sapphire_crystal?.total_placed ?? 0;
    let amethyst_places = data?.crystals?.amethyst_crystal?.total_placed ?? 0;

    let runs = Math.min(jade_places, amber_places, topaz_places, sapphire_places, amethyst_places)

    let response = `§aNu§6cle§eus §bRu§5ns: ${runs}`;

    return response;
  }

  async onCommand(username, message, channel = "gc") {
    try {
      username = this.getArgs(message)[0] || username;
      const data = await getLatestProfile(username);
      username = formatUsername(username, data.profileData?.game_mode);

      let hotm_data = data?.profile?.mining_core;

      if (hotm_data == undefined) {
        throw "Player has no HOTM data.";
      }

      let hotm_exp = hotm_data?.experience;
      let hotm_level_data = await this.getHOTMLevel(hotm_exp);      

      let Name = `§6${username}'s HOTM Stats:`;
      let Lore = [];

      Lore.push(`§f`);

      Lore.push(`§7HOTM Level: §6§l${hotm_level_data?.level} §7(${formatNumber(hotm_exp)} EXP)`);
      Lore.push(`§7Next Level: ${
        hotm_level_data?.next_level == null ? "§a§lMAXED" : `§6§l${hotm_level_data?.next_level} §7(${formatNumber(hotm_level_data?.xp_left)} / ${formatNumber(hotm_level_data?.xp_to_next)})`
      }`);

      Lore.push(`§f`);

      Lore.push(this.getPowderInfo("mithril", "Mithril", "§2", hotm_data));
      Lore.push(this.getPowderInfo("gemstone", "Gemstone", "§d", hotm_data));
      Lore.push(this.getPowderInfo("glacite", "Glacite", "§b", hotm_data));

      Lore.push(`§f`);

      Lore.push(this.getNucleusRuns(hotm_data));

      Lore.push(`§f`);

      console.log(Lore)

      const renderedItem = await renderLore(Name, Lore);
      const upload = await uploadImage(renderedItem);
      this.send(`/${channel} ${username}'s HOTM stats: ${upload.data.link}.`);
      /*

      

      let medals_inv = jacob_data?.medals_inv ?? {};
      let unique_brackets = jacob_data?.unique_brackets ?? {};
      let contests = jacob_data?.contests ?? {};
      let personal_bests = jacob_data?.personal_bests ?? {};
      let golds = 0;

      console.log(medals_inv, unique_brackets, Object.entries(contests).length, personal_bests);

      let crops = {
        WHEAT: "Wheat",
        CARROT_ITEM: "Carrot",
        POTATO_ITEM: "Potato",
        PUMPKIN: "Pumpkin",
        MELON: "Melon",
        MUSHROOM_COLLECTION: "Mushroom",
        CACTUS: "Cactus",
        SUGAR_CANE: "Sugar Cane",
        NETHER_STALK: "Nether Wart",
        "INK_SACK:3": "Cocoa Beans",
      };

      Object.entries(crops).forEach((element) => {
        let crop_id = element[0];
        let crop_name = element[1];

        let crop_data = this.getCropMedals(crop_id, crop_name, unique_brackets, personal_bests);
        golds += crop_data.gold;

        Lore.push(crop_data.display);
      });

      Lore.push(`§f`);

      Lore.unshift(`§f`);
      Lore.unshift(
        `§7Medals inventory: §c${medals_inv.bronze ?? 0}§7 | §f${medals_inv.silver ?? 0}§7 | §6${medals_inv.gold ?? 0}§7.`,
      );
      Lore.unshift(`§f`);
      Lore.unshift(`§7Unique golds: §6${golds}§7/10.`);
      Lore.unshift(`§7Participated in §6${Object.entries(contests).length}§7 contests.`);
      Lore.unshift(`§f`);
      */
    } catch (error) {
      console.log(error);
      this.send(`/${channel} [ERROR] ${error}`);
    }
  }
}

module.exports = MedalsCommand;
