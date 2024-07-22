const minecraftCommand = require('../../contracts/minecraftCommand.js');
const { getUUID } = require('../../contracts/API/PlayerDBAPI.js');
const axios = require('axios');
const config = require('../../../config.js');
const rabbits_handler = require('../../../API/constants/rabbits.js');
const { formatNumber, formatUsername } = require('../../contracts/helperFunctions.js');
const { renderLore } = require('../../contracts/renderItem.js');
const { uploadImage } = require('../../contracts/API/imgurAPI.js');
const Logger = require('#root/src/Logger.js');

function convertPrestige(prestige) {
    const prestiges = {
        1: '§a§lI',
        2: '§9§lII',
        3: '§5§lIII',
        4: '§6§lIV',
        5: '§d§lV',
        6: '§b§lVI'
    };

    let response = prestiges?.[prestige] ?? '§7Unknown';
    return response;
}

function convertEmployeeLevel(level) {
    if (level >= 220) {
        return `§7[${level}] §bBoard Member`;
    }
    if (level >= 200) {
        return `§7[${level}] §dExecutive`;
    }
    if (level >= 175) {
        return `§7[${level}] §6Director`;
    }
    if (level >= 125) {
        return `§7[${level}] §5Manager`;
    }
    if (level >= 75) {
        return `§7[${level}] §9Assistant`;
    }
    if (level >= 10) {
        return `§7[${level}] §aEmployee`;
    }
    if (level > 0) {
        return `§7[${level}] §fIntern`;
    }
    if (level <= 0) {
        return `§7[0] §7Unemployed`;
    }

    return 'N/A';
}

function prepareRabbits(rabbits) {
    delete rabbits?.collected_eggs;
    delete rabbits?.collected_locations;

    let formatting = {
        COMMON: '§f§lCOMMON',
        UNCOMMON: '§a§lUNCOMMON',
        RARE: '§9§lRARE',
        EPIC: '§5§lEPIC',
        LEGENDARY: '§6§lLEGENDARY',
        MYTHIC: '§d§lMYTHIC',
        DIVINE: '§b§lDIVINE',
        UNKNOWN: '§7§lUNKNOWN'
    };

    let rarities = {
        COMMON: 0,
        UNCOMMON: 0,
        RARE: 0,
        EPIC: 0,
        LEGENDARY: 0,
        MYTHIC: 0,
        DIVINE: 0,
    };

    let rabbits_caught = 0;
    let rabbits_total = 0;

    for (let rabbit_data of Object.entries(rabbits)) {
        let rabbit = rabbit_data[0];
        let rabbit_counter = rabbit_data[1];

        rabbits_caught += Math.min(rabbit_counter, 1);
        rabbits_total += rabbit_counter;

        let rarity = rabbits_handler.getRabbitRarity(rabbit);
        rarities[rarity] = (rarities[rarity] ?? 0) + 1;
    }

    let lines = [];
    let rabbits_counter = 0;
    let total_counter = 0;

    for (let rarity_data of Object.entries(rarities)) {
        let rarity_id = rarity_data[0];
        let rabbits = rarity_data[1];
        let ctr_color = 'c';
        let formatted_rarity = formatting?.[rarity_id];

        let rabbits_total = (rabbits_handler?.[rarity_id.toLowerCase()] ?? {})?.length ?? 0;

        rabbits_counter += rabbits;
        total_counter += rabbits_total;

        if (rabbits >= rabbits_total) {
            ctr_color = 'a';
        }

        lines.push(`${formatted_rarity} §7Rabbits: §${ctr_color}${rabbits}§7/§a${rabbits_total}`);
    }

    let total_color = 'c';
    if (rabbits_counter >= total_counter) {
        total_color = 'a';
    }

    lines.unshift(`§${total_color}§lTOTAL §7Rabbits: §${total_color}${rabbits_counter}§7/§a${total_counter}`);
    lines.unshift(
        `§7Eggs found: §6${rabbits_total}§7 (Unique: §a${rabbits_caught}§7 | Dupe: §c${rabbits_total - rabbits_caught}§7)`
    );

    return lines;
}

class topCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'chocolate';
        this.aliases = ['cf', 'hoppity', 'choc'];
        this.description = 'Sends your Chocolate Factory stats';
        this.options = [
            {
                name: 'username',
                description: 'Minecraft username',
                required: false
            }
        ];
    }

    async onCommand(username, message, channel = 'gc') {
        try {
            let passed_username = this.getArgs(message)[0];
            username = passed_username || username;
            const player_uuid = await getUUID(username);

            let player_profile = `https://api.hypixel.net/v2/skyblock/profiles?key=${config.minecraft.API.hypixelAPIkey}&uuid=${player_uuid}`;

            let player_data = await Promise.all([axios.get(player_profile)]).catch((error) => {
                throw 'Player has no SkyBlock profiles.';
            });

            player_data = player_data[0].data ?? {};
            if (!player_data?.success) {
                throw 'Player has no SkyBlock profiles.';
            }

            let selected_profile = null;

            for (let profile of player_data?.profiles ?? []) {
                if (profile?.selected == true) {
                    selected_profile = profile?.members?.[player_uuid];
                }
            }

            if (selected_profile == null || selected_profile == undefined) {
                throw 'Player has no selected profile.';
            }

            let easter_stats = selected_profile?.events?.easter;

            if (easter_stats == undefined) {
                throw "Player hasn't participated in the easter event.";
            }

            let chocolate = easter_stats?.chocolate ?? 0;
            let chocolate_since_prestige = easter_stats?.chocolate_since_prestige ?? 0;
            let total_chocolate = easter_stats?.total_chocolate ?? 0;
            let rabbits = easter_stats?.rabbits ?? {};
            let employees = easter_stats?.employees;
            let prestige = easter_stats?.chocolate_level ?? 0;

            let barn_capacity = easter_stats?.rabbit_barn_capacity_level ?? 0;
            let click_upgrades = 1 + (easter_stats?.click_upgrades ?? 0);
            let time_tower = easter_stats?.time_tower?.level ?? 0;
            let shrine = easter_stats?.rabbit_rarity_upgrades ?? 0;
            let coach = easter_stats?.chocolate_multiplier_upgrades ?? 0;

            let Name = `§6${username}'s Chocolate Factory:`;
            let Lore = [];

            Lore.push(`§f`);
            Lore.push(`§7Prestige: ${convertPrestige(prestige)}`);
            Lore.push(`§f`);
            Lore.push(`§7Current Chocolate: §6${formatNumber(chocolate)}`);
            Lore.push(`§7This Prestige: §6${formatNumber(chocolate_since_prestige)}`);
            Lore.push(`§7Total Chocolate: §6${formatNumber(total_chocolate)}`);
            Lore.push(`§f`);
            Lore.push(`§7Rabbits:`);
            Lore.push(...prepareRabbits(rabbits));
            Lore.push(`§f`);
            Lore.push(`§7Employees:`);
            Lore.push(`§7Rabbit Bro: ${convertEmployeeLevel(employees?.rabbit_bro ?? 0)}`);
            Lore.push(`§7Rabbit Cousin: ${convertEmployeeLevel(employees?.rabbit_cousin ?? 0)}`);
            Lore.push(`§7Rabbit Sis: ${convertEmployeeLevel(employees?.rabbit_sis ?? 0)}`);
            Lore.push(`§7Rabbit Father: ${convertEmployeeLevel(employees?.rabbit_father ?? 0)}`);
            Lore.push(`§7Rabbit Grandma: ${convertEmployeeLevel(employees?.rabbit_grandma ?? 0)}`);
            Lore.push(`§7Rabbit Uncle: ${convertEmployeeLevel(employees?.rabbit_uncle ?? 0)}`);
            Lore.push(`§7Rabbit Dog: ${convertEmployeeLevel(employees?.rabbit_dog ?? 0)}`);
            Lore.push(`§f`);
            Lore.push(`§7Upgrades:`);
            Lore.push(`§aRabbit Barn ${barn_capacity}`);
            Lore.push(`§dHand-Baked Chocolate ${click_upgrades}`);
            Lore.push(`§dTime Tower: ${time_tower}`);
            Lore.push(`§dRabbit Shrine: ${shrine}`);
            Lore.push(`§dCoach Jackrabbit: ${coach}`);
            Lore.push(`§f`);

            const renderedItem = await renderLore(Name, Lore);
            const upload = await uploadImage(renderedItem);

            if (!config.minecraft.commands.integrate_images) {
                this.send(
                    `/${channel} ${username} Chocolate Factory: Prestige: ${prestige} | Chocolate: ${formatNumber(chocolate)} (Prestige: ${formatNumber(chocolate_since_prestige)} | All Time: ${formatNumber(total_chocolate)}). Full response in Discord.`
                );
                this.sendDiscordFollowup(channel, upload.data.link, [renderedItem]);
                return;
            }

            this.send(`/${channel} ${username}'s Chocolate Factory stats: ${upload.data.link}.`);
        } catch (error) {
            Logger.warnMessage(error);
            this.send(`/${channel} [ERROR] ${error}`);
        }
    }
}

module.exports = topCommand;
