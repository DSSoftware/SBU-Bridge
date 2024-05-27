const nodeNames = {
    mining_speed_2: 'MS2',
    powder_buff: 'PB',
    mining_fortune_2: 'MF2',
    vein_seeker: 'VS',
    lonesome_miner: 'LM',
    professional: 'Prof',
    mole: 'Mole',
    fortunate: 'Fort',
    great_explorer: 'GE',
    maniac_miner: 'MM',
    goblin_killer: 'GK',
    special_0: 'POTM',
    star_powder: 'SP',
    daily_effect: 'SM',
    mining_madness: 'MM',
    mining_experience: 'SM',
    efficient_miner: 'EM',
    experience_orbs: 'Orb',
    front_loaded: 'FL',
    precision_mining: 'PM',
    random_event: 'LotC',
    daily_powder: 'DP',
    fallen_star_bonus: 'Crys',
    mining_speed_boost: 'MSB',
    titanium_insanium: 'TI',
    mining_fortune: 'MF',
    forge_time: 'QF',
    pickaxe_toss: 'Pick',
    mining_speed: 'MS',
    gemstone_infusion: 'GI',
    gifts_from_the_departed: 'GftD',
    frozen_solid: 'FS',
    hungry_for_more: 'DMC',
    excavator: 'Exc',
    rags_of_riches: 'RoR',
    hazardous_miner: 'HM',
    surveyor: 'Surv',
    subzero_mining: 'SZM',
    eager_adventurer: 'EA',
    keen_eye: 'KE',
    warm_hearted: 'WH',
    dust_collector: 'DC',
    daily_grind: 'DG',
    strong_arm: 'SA',
    no_stone_unturned: 'NSU',
    mineshaft_mayhem: 'MM'
};

class Node {
    constructor(data) {
        this.nodeType = 'normal';
        this.level = data.level;
    }

    get color() {
        return this.status === 'maxed' ? 'a' : this.status === 'unlocked' ? 'e' : '7';
    }

    get nodeSymbol() {
        const nameColor = this.color;
        const symbol = this.status === 'maxed' ? '●' : this.status === 'unlocked' ? '○' : '○';
        return `${symbol}`;
    }

    get displayName() {
        const nameColor = this.color;
        return `${this.name}`;
    }

    get status() {
        if (this.level === this.max_level) {
            return 'maxed';
        }

        if (this.level === 0) {
            return 'locked';
        }

        return 'unlocked';
    }

    get maxed() {
        return this.level === this.max_level;
    }
}

class MiningSpeed2 extends Node {
    constructor(data) {
        super(data);
        this.id = 'mining_speed_2';
        this.name = nodeNames[this.id];
        this.position = 29;
        this.max_level = 50;
        this.upgrade_type = 'gemstone_powder';
        this.requires = ['lonesome_miner'];
        this.positionType = 'vertical_line';
    }

    get upgradeCost() {
        const nextLevel = this.level + 1;
        return floor(Math.pow(nextLevel + 1, 3.2));
    }

    perk(level) {
        const val = level * 40;
        return [`§7Grants §a+${val} §6${SYMBOLS.mining_speed} Mining Speed§7.`];
    }
}

class PowderBuff extends Node {
    constructor(data) {
        super(data);
        this.id = 'powder_buff';
        this.name = nodeNames[this.id];
        this.position = 31;
        this.max_level = 50;
        this.upgrade_type = 'gemstone_powder';
        this.requires = ['mole'];
        this.positionType = 'vertical_line';
    }

    get upgradeCost() {
        const nextLevel = this.level + 1;
        return floor(Math.pow(nextLevel + 1, 3.2));
    }

    perk(level) {
        const val = level * 1;
        return [`§7Gain §a${val}% §7more Mithril Powder and Gemstone Powder.`];
    }
}

class MiningFortune2 extends Node {
    constructor(data) {
        super(data);
        this.id = 'mining_fortune_2';
        this.name = nodeNames[this.id];
        this.position = 33;
        this.max_level = 50;
        this.upgrade_type = 'gemstone_powder';
        this.requires = ['great_explorer'];
        this.positionType = 'vertical_line';
    }

    get upgradeCost() {
        const nextLevel = this.level + 1;
        return floor(Math.pow(nextLevel + 1, 3.2));
    }

    perk(level) {
        const val = level * 5;
        return [`§7Grants §a+${val} §6${SYMBOLS.mining_fortune} Mining Fortune§7.`];
    }
}

class VeinSeeker extends Node {
    constructor(data) {
        super(data);
        this.id = 'vein_seeker';
        this.name = nodeNames[this.id];
        this.position = 37;
        this.max_level = 1;
        this.upgrade_type = null;
        this.requires = ['lonesome_miner'];
        this.nodeType = 'pickaxe_ability';
        this.positionType = 'right_ability';
    }

    get upgradeCost() {
        return 0;
    }

    perk(level) {
        const spread = [2, 3, 4][this.pickaxeAbilityLevel - 1];
        const duration = [12, 14, 16][this.pickaxeAbilityLevel - 1];
        const cooldown = [60, 60, 60][this.pickaxeAbilityLevel - 1];
        return [
            '§6Pickaxe Ability: Vein Seeker',
            `§7Points in the direction of the nearest vein and grants §a+${spread} §6Mining Spread §7for §a${duration}s§7.`,
            `§8Cooldown: §a${cooldown}s`,
            '',
            '§8Pickaxe Abilities apply to all of your pickaxes. You can select a Pickaxe Ability from your Heart of the Mountain.',
            '',
            '§8Upgrade your Pickaxe Abilities by unlocking §cPeak of the Mountain §8in this menu!'
        ];
    }
}

class LonesomeMiner extends Node {
    constructor(data) {
        super(data);
        this.id = 'lonesome_miner';
        this.name = nodeNames[this.id];
        this.position = 38;
        this.max_level = 45;
        this.upgrade_type = 'gemstone_powder';
        this.requires = ['goblin_killer', 'professional'];
        this.positionType = 'cross';
    }

    get upgradeCost() {
        const nextLevel = this.level + 1;
        return floor(Math.pow(nextLevel + 1, 3.07));
    }

    perk(level) {
        const val = round(5 + (level - 1) * 0.5);
        return [
            `§7Increases §c${SYMBOLS.strength} Strength, §9${SYMBOLS.crit_chance} Crit Chance, §9${SYMBOLS.crit_damage} Crit Damage, §a${SYMBOLS.defense} Defense, and §c${SYMBOLS.health} Health §7statistics gain by §a${val}% §7while in the Crystal Hollows.`
        ];
    }
}

class Professional extends Node {
    constructor(data) {
        super(data);
        this.id = 'professional';
        this.name = nodeNames[this.id];
        this.position = 39;
        this.max_level = 140;
        this.upgrade_type = 'gemstone_powder';
        this.requires = ['mole', 'lonesome_miner'];
        this.positionType = 'horizontal_line';
    }

    get upgradeCost() {
        const nextLevel = this.level + 1;
        return floor(Math.pow(nextLevel + 1, 2.3));
    }

    perk(level) {
        const val = 50 + level * 5;
        return [`§7Gain §a+${val}§7 §6${SYMBOLS.mining_speed} Mining Speed§7 when mining Gemstones.`];
    }
}

class Mole extends Node {
    constructor(data) {
        super(data);
        this.id = 'mole';
        this.name = nodeNames[this.id];
        this.position = 40;
        this.max_level = 190;
        this.upgrade_type = 'gemstone_powder';
        this.requires = ['efficient_miner', 'professional', 'fortunate'];
        this.positionType = 'cross';
    }

    get upgradeCost() {
        const nextLevel = this.level + 1;
        return floor(Math.pow(nextLevel + 1, 2.2));
    }

    perk(level) {
        const chance = 50 + (level - 1) * 5;
        let blocks = 1 + floor(chance / 100);
        let percent = chance - floor(chance / 100) * 100;
        if (percent === 0) {
            blocks -= 1;
            percent = 100;
        }

        return [
            `§7When mining hard stone, you have a §a${percent}%§7 chance to mine §a${blocks}§7 adjacent hard stone block.`
        ];
    }
}

class Fortunate extends Node {
    constructor(data) {
        super(data);
        this.id = 'fortunate';
        this.name = nodeNames[this.id];
        this.position = 41;
        this.max_level = 20;
        this.upgrade_type = 'mithril_powder';
        this.requires = ['mole', 'great_explorer'];
        this.positionType = 'horizontal_line';
    }

    get upgradeCost() {
        const nextLevel = this.level + 1;
        return floor(Math.pow(nextLevel + 1, 3.05));
    }

    perk(level) {
        const val = 20 + level * 4;
        return [`§7Grants §a+${val}§7 §6${SYMBOLS.mining_fortune} Mining Fortune§7 when mining Gemstone.`];
    }
}

class GreatExplorer extends Node {
    constructor(data) {
        super(data);
        this.id = 'great_explorer';
        this.name = nodeNames[this.id];
        this.position = 42;
        this.max_level = 20;
        this.upgrade_type = 'gemstone_powder';
        this.requires = ['star_powder', 'fortunate'];
        this.positionType = 'cross';
    }

    get upgradeCost() {
        const nextLevel = this.level + 1;
        return floor(Math.pow(nextLevel + 1, 4));
    }

    perk(level) {
        const perc = 20 + (level - 1) * 4;
        const val = 1 + Math.floor(level / 5);
        return [
            `§7Boosts the chance to find treasure chests while mining in the §5Crystal Hollows §7by §a${perc}% §7and reduces the amount of locks on the chest by §a${val}§7.`
        ];
    }
}

class ManiacMiner extends Node {
    constructor(data) {
        super(data);
        this.id = 'maniac_miner';
        this.name = nodeNames[this.id];
        this.position = 43;
        this.max_level = 1;
        this.upgrade_type = null;
        this.requires = ['great_explorer'];
        this.nodeType = 'pickaxe_ability';
        this.positionType = 'left_ability';
    }

    get upgradeCost() {
        return 0;
    }

    perk(level) {
        const speed = [1, 1, 1][this.pickaxeAbilityLevel - 1];
        const duration = [10, 15, 20][this.pickaxeAbilityLevel - 1];
        const cooldown = [60, 59, 59][this.pickaxeAbilityLevel - 1];
        return [
            '§6Pickaxe Ability: Maniac Miner',
            `§7Spends all your Mana and grants §a+${speed} §6${SYMBOLS.mining_speed} Mining Speed §7for every 10 Mana spent, for §a${duration}s§7.`,
            `§8Cooldown: §a${cooldown}s`,
            '',
            '§8Pickaxe Abilities apply to all of your pickaxes. You can select a Pickaxe Ability from your Heart of the Mountain.',
            '',
            '§8Upgrade your Pickaxe Abilities by unlocking §cPeak of the Mountain §8in this menu!'
        ];
    }
}

class GoblinKiller extends Node {
    constructor(data) {
        super(data);
        this.id = 'goblin_killer';
        this.name = nodeNames[this.id];
        this.position = 47;
        this.max_level = 1;
        this.upgrade_type = null;
        this.requires = ['mining_madness', 'lonesome_miner'];
        this.positionType = 'vertical_line';
    }

    get upgradeCost() {
        return 0;
    }

    perk(level) {
        return [
            `§7Killing a §6Golden Goblin §7or §bDiamond Goblin §7gives §2200 §7extra §2Mithril Powder§7, while killing other Goblins gives some based on their wits.`
        ];
    }
}

class PeakOfTheMountain extends Node {
    constructor(data) {
        super(data);
        this.id = 'special_0';
        this.name = nodeNames[this.id];
        this.position = 49;
        this.max_level = 10;
        this.upgrade_type = data.level >= 5 ? 'gemstone_powder' : 'mithril_powder';
        this.requires = ['efficient_miner'];
        this.nodeType = 'special';
        this.positionType = 'peak_of_the_mountain';
    }

    get upgradeCost() {
        const nextLevel = this.level + 1;
        return nextLevel <= 5 ? floor(25000 * nextLevel) : floor(500000 + 250000 * (nextLevel - 6));
    }

    perk(level) {
        const output = [];

        const baseTier = level > this.level ? level : 1;

        for (let tier = baseTier; tier <= level; tier++) {
            for (const [reward, qty] of Object.entries(rewards.potm[tier] ?? {})) {
                const qtyColor = rewards.rewards[reward].qtyColor;
                const formatted = rewards.rewards[reward].formatted;
                output.push(`§8+ §${qtyColor}${qty} ${formatted}`);
            }
        }

        return output;
    }

    get unlockCost() {
        return {
            free: 0
        };
    }
}

class StarPowder extends Node {
    constructor(data) {
        super(data);
        this.id = 'star_powder';
        this.name = nodeNames[this.id];
        this.position = 51;
        this.max_level = 1;
        this.upgrade_type = null;
        this.requires = ['front_loaded', 'great_explorer'];
        this.positionType = 'vertical_line';
    }

    get upgradeCost() {
        return 0;
    }

    perk(level) {
        return [`§7Mining Mithril Ore near §5Fallen Crystals §7gives §a3x §7Mithril Powder.`];
    }
}

class SkyMall extends Node {
    constructor(data) {
        super(data);
        this.id = 'daily_effect';
        this.name = nodeNames[this.id];
        this.position = 55;
        this.max_level = 1;
        this.upgrade_type = null;
        this.requires = ['mining_madness'];
        this.positionType = 'left_perk';
    }

    get upgradeCost() {
        return 0;
    }

    perk(level) {
        return [
            '§7Every SkyBlock day, you receive a random buff in the §2Dwarven Mines§7.',
            '',
            '§7Possible Buffs',
            `§8 ■ §7Gain §a+100 §6${SYMBOLS.mining_speed} Mining Speed§7.`,
            `§8 ■ §7Gain §a+50 §6${SYMBOLS.mining_fortune} Mining Fortune§7.`,
            '§8 ■ §7Gain §a+15% §7chance to gain extra Powder while mining.',
            '§8 ■ §7Reduce Pickaxe Ability cooldown by §a20%§7.',
            '§8 ■ §7§a10x §7chance to find Goblins while mining.',
            '§8 ■ §7Gain §a5x §9Titanium §7drops.'
        ];
    }
}

class MiningMadness extends Node {
    constructor(data) {
        super(data);
        this.id = 'mining_madness';
        this.name = nodeNames[this.id];
        this.position = 56;
        this.max_level = 1;
        this.upgrade_type = null;
        this.requires = ['random_event', 'mining_experience', 'goblin_killer'];
        this.positionType = 'cross';
    }

    get upgradeCost() {
        return 0;
    }

    perk(level) {
        return [
            `§7Grants §a+50 §6${SYMBOLS.mining_speed} Mining Speed §7and §6${SYMBOLS.mining_fortune} Mining Fortune§7.`
        ];
    }
}

class SeasonedMineman extends Node {
    constructor(data) {
        super(data);
        this.id = 'mining_experience';
        this.name = nodeNames[this.id];
        this.position = 57;
        this.max_level = 100;
        this.upgrade_type = 'mithril_powder';
        this.requires = ['efficient_miner', 'mining_madness'];
        this.positionType = 'horizontal_line';
    }

    get upgradeCost() {
        const nextLevel = this.level + 1;
        return floor(Math.pow(nextLevel + 1, 2.3));
    }

    perk(level) {
        const val = round(5 + level * 0.1, 1);
        return [`§7Increases your Mining experience gain by §a${val}%§7.`];
    }
}

class EfficientMiner extends Node {
    constructor(data) {
        super(data);
        this.id = 'efficient_miner';
        this.name = nodeNames[this.id];
        this.position = 58;
        this.max_level = 100;
        this.upgrade_type = 'mithril_powder';
        this.requires = ['daily_powder', 'mining_experience', 'experience_orbs'];
        this.positionType = 'cross';
    }

    get upgradeCost() {
        const nextLevel = this.level + 1;
        return floor(Math.pow(nextLevel + 1, 2.6));
    }

    perk(level) {
        const val1 = round(10 + level * 0.4, 1);
        const val2 = ceil((level + 1) / 20);
        return [`§7When mining ores, you have a §a${val1}%§7 chance to mine §a${val2} §7adjacent ores.`];
    }
}

class Orbiter extends Node {
    constructor(data) {
        super(data);
        this.id = 'experience_orbs';
        this.name = nodeNames[this.id];
        this.position = 59;
        this.max_level = 80;
        this.upgrade_type = 'mithril_powder';
        this.requires = ['efficient_miner', 'front_loaded'];
        this.positionType = 'horizontal_line';
    }

    get upgradeCost() {
        const nextLevel = this.level + 1;
        return floor(70 * nextLevel);
    }

    perk(level) {
        const val = round(0.2 + level * 0.01, 2);
        return [`§7When mining ores, you have a §a${val}%§7 chance to get a random amount of experience orbs.`];
    }
}

class FrontLoaded extends Node {
    constructor(data) {
        super(data);
        this.id = 'front_loaded';
        this.name = nodeNames[this.id];
        this.position = 60;
        this.max_level = 1;
        this.upgrade_type = null;
        this.requires = ['fallen_star_bonus', 'experience_orbs', 'star_powder'];
        this.positionType = 'cross';
    }

    get upgradeCost() {
        return 0;
    }

    perk(level) {
        return [
            `§7Grants §a+100 §6${SYMBOLS.mining_speed} Mining Speed §7and §6${SYMBOLS.mining_fortune} Mining Fortune §7as well as §a+2 base powder §7for the first §e2,500 §7ores you mine in a day.`
        ];
    }
}

class PrecisionMining extends Node {
    constructor(data) {
        super(data);
        this.id = 'precision_mining';
        this.name = nodeNames[this.id];
        this.position = 61;
        this.max_level = 1;
        this.upgrade_type = null;
        this.requires = ['front_loaded'];
        this.positionType = 'right_perk';
    }

    get upgradeCost() {
        return 0;
    }

    perk(level) {
        return [
            `§7When mining ore, a particle target appears on the block that increases your §6${SYMBOLS.mining_speed} Mining Speed §7by §a30% §7when aiming at it.`
        ];
    }
}

class LuckOfTheCave extends Node {
    constructor(data) {
        super(data);
        this.id = 'random_event';
        this.name = nodeNames[this.id];
        this.position = 65;
        this.max_level = 45;
        this.upgrade_type = 'mithril_powder';
        this.requires = ['mining_speed_boost', 'mining_madness'];
        this.positionType = 'vertical_line';
    }

    get upgradeCost() {
        const nextLevel = this.level + 1;
        return floor(Math.pow(nextLevel + 1, 3.07));
    }

    perk(level) {
        const val = 5 + level * 1;
        return [
            `§7Increases the chance for you to trigger rare occurrences in §2Dwarven Mines §7by §a${val}%§7.`,
            ``,
            `§7Rare occurrences include:`,
            `§8§l· §6Golden Goblins`,
            `§8§l· §5Fallen Stars`,
            `§8§l· §6Powder Ghasts`
        ];
    }
}

class DailyPowder extends Node {
    constructor(data) {
        super(data);
        this.id = 'daily_powder';
        this.name = nodeNames[this.id];
        this.position = 67;
        this.max_level = 100;
        this.upgrade_type = 'mithril_powder';
        this.requires = ['mining_fortune'];
        this.positionType = 'vertical_line';
    }

    get upgradeCost() {
        const nextLevel = this.level + 1;
        return floor(182 + 18 * nextLevel);
    }

    perk(level) {
        const val = 400 + (level - 1) * 36;
        return [`§7Gain §a${val} Powder §7from the first ore you mine every day. Works for all Powder types.`];
    }
}

class Crystallized extends Node {
    constructor(data) {
        super(data);
        this.id = 'fallen_star_bonus';
        this.name = nodeNames[this.id];
        this.position = 69;
        this.max_level = 30;
        this.upgrade_type = 'mithril_powder';
        this.requires = ['pickaxe_toss', 'front_loaded'];
        this.positionType = 'vertical_line';
    }

    get upgradeCost() {
        const nextLevel = this.level + 1;
        return floor(Math.pow(nextLevel + 1, 3.4));
    }

    perk(level) {
        const speed = 20 + (level - 1) * 6;
        const fortune = 20 + (level - 1) * 5;
        return [
            `§7Increases §6${speed} ${SYMBOLS.mining_speed} Mining Speed §7and §6${fortune} ${SYMBOLS.mining_fortune} Mining Fortune §7near §5Fallen Stars§7.`
        ];
    }
}

class MiningSpeedBoost extends Node {
    constructor(data) {
        super(data);
        this.id = 'mining_speed_boost';
        this.name = nodeNames[this.id];
        this.position = 74;
        this.max_level = 1;
        this.upgrade_type = null;
        this.requires = ['titanium_insanium', 'random_event'];
        this.nodeType = 'pickaxe_ability';
        this.positionType = 'left_l';
    }

    get upgradeCost() {
        return 0;
    }

    perk(level) {
        const effect = [200, 300, 400][this.pickaxeAbilityLevel - 1];
        const duration = [15, 20, 25][this.pickaxeAbilityLevel - 1];
        const cooldown = [120, 120, 120][this.pickaxeAbilityLevel - 1];
        return [
            '§6Pickaxe Ability: Mining Speed Boost',
            `§7Grants §a+${effect}% §6${SYMBOLS.mining_speed} Mining Speed §7for §a${duration}s§7.`,
            `§8Cooldown: §a${cooldown}s`,
            '',
            '§8Pickaxe Abilities apply to all of your pickaxes. You can select a Pickaxe Ability from your Heart of the Mountain.',
            '',
            '§8Upgrade your Pickaxe Abilities by unlocking §cPeak of the Mountain §8in this menu!'
        ];
    }
}

class TitaniumInsanium extends Node {
    constructor(data) {
        super(data);
        this.id = 'titanium_insanium';
        this.name = nodeNames[this.id];
        this.position = 75;
        this.max_level = 50;
        this.upgrade_type = 'mithril_powder';
        this.requires = ['mining_fortune', 'mining_speed_boost'];
        this.positionType = 'horizontal_line';
    }

    get upgradeCost() {
        const nextLevel = this.level + 1;
        return floor(Math.pow(nextLevel + 1, 3.1));
    }

    perk(level) {
        const val = round(2 + level * 0.1, 1);
        return [`§7When mining Mithril Ore, you have a §a${val}%§7 chance to convert the block into Titanium Ore.`];
    }
}

class MiningFortune extends Node {
    constructor(data) {
        super(data);
        this.id = 'mining_fortune';
        this.name = nodeNames[this.id];
        this.position = 76;
        this.max_level = 50;
        this.upgrade_type = 'mithril_powder';
        this.requires = ['mining_speed'];
        this.positionType = 'cross';
    }

    get upgradeCost() {
        const nextLevel = this.level + 1;
        return floor(Math.pow(nextLevel + 1, 3.05));
    }

    perk(level) {
        const val = level * 5;
        return [`§7Grants §a+${val} §6${SYMBOLS.mining_fortune} Mining Fortune§7.`];
    }
}

class QuickForge extends Node {
    constructor(data) {
        super(data);
        this.id = 'forge_time';
        this.name = nodeNames[this.id];
        this.position = 77;
        this.max_level = 20;
        this.upgrade_type = 'mithril_powder';
        this.requires = ['mining_fortune', 'pickaxe_toss'];
        this.positionType = 'horizontal_line';
    }

    get upgradeCost() {
        const nextLevel = this.level + 1;
        return floor(Math.pow(nextLevel + 1, 4));
    }

    perk(level) {
        let val = round(10 + 0.5 * level, 1);
        if (level === this.max_level) {
            val = 30;
        }
        return [`§7Decreases the time it takes to forge by §a${val}%§7.`];
    }
}

class Pickobulus extends Node {
    constructor(data) {
        super(data);
        this.id = 'pickaxe_toss';
        this.name = nodeNames[this.id];
        this.position = 78;
        this.max_level = 1;
        this.upgrade_type = null;
        this.requires = ['forge_time', 'fallen_star_bonus'];
        this.nodeType = 'pickaxe_ability';
        this.positionType = 'right_l';
    }

    get upgradeCost() {
        return 0;
    }

    perk(level) {
        const radius = [2, 2, 3][this.pickaxeAbilityLevel - 1];
        const cooldown = [120, 110, 110][this.pickaxeAbilityLevel - 1];
        return [
            '§6Pickaxe Ability: Pickobulus',
            `§7Throw your pickaxe to create an explosion on impact, mining all ores within a §a${radius}§7 block radius.`,
            `§8Cooldown: §a${cooldown}s`,
            '',
            '§8Pickaxe Abilities apply to all of your pickaxes. You can select a Pickaxe Ability from your Heart of the Mountain.',
            '',
            '§8Upgrade your Pickaxe Abilities by unlocking §cPeak of the Mountain §8in this menu!'
        ];
    }
}

class MiningSpeed extends Node {
    constructor(data) {
        super(data);
        this.id = 'mining_speed';
        this.name = nodeNames[this.id];
        this.position = 85;
        this.max_level = 50;
        this.upgrade_type = 'mithril_powder';
        this.requires = [];
        this.positionType = 'vertical_line';
    }

    get upgradeCost() {
        const nextLevel = this.level + 1;
        return floor(Math.pow(nextLevel + 1, 3));
    }

    perk(level) {
        const val = level * 20;
        return [`§7Grants §a+${val} §6${SYMBOLS.mining_speed} Mining Speed§7.`];
    }
}
class GemstoneInfusion extends Node {
    constructor(data) {
        super(data);
        this.id = 'gemstone_infusion';
        this.name = nodeNames[this.id];
        this.position = 1;
        this.max_level = 1;
        this.upgrade_type = null;
        this.requires = ['gifts_from_the_departed'];
        this.nodeType = 'pickaxe_ability';
        this.positionType = 'right_ability';
    }

    get upgradeCost() {
        return 0;
    }

    perk(level) {
        const boost = [50, 50, 50][this.pickaxeAbilityLevel - 1];
        const duration = [16, 16, 16][this.pickaxeAbilityLevel - 1];
        const cooldown = [140, 140, 140][this.pickaxeAbilityLevel - 1];
        return [
            '§6Pickaxe Ability: Gemstone Infusion',
            `§7Increases the effectivness of §6every Gemstone §7in your pick's Gemstone Slots by §a${boost}% §7for §a${duration}s.`,
            `§8Cooldown: §a${cooldown}s`,
            '',
            '§8Pickaxe Abilities apply to all of your pickaxes. You can select a Pickaxe Ability from your Heart of the Mountain.',
            '',
            '§8Upgrade your Pickaxe Abilities by unlocking §cPeak of the Mountain §8in this menu!'
        ];
    }
}

class GiftsFromTheDeparted extends Node {
    constructor(data) {
        super(data);
        this.id = 'gifts_from_the_departed';
        this.name = nodeNames[this.id];
        this.position = 2;
        this.max_level = 100;
        this.upgrade_type = 'glacite_powder';
        this.requires = [];
        this.positionType = 'top';
    }

    get upgradeCost() {
        const nextLevel = this.level + 1;

        return nextLevel + 1;
    }

    perk(level) {
        const val = level * 0.2;

        return [`§7Gain a §a${val}% §7chance to get an extra item when looting a §bFrozen Corpse§7.`];
    }
}

class FrozenSolid extends Node {
    constructor(data) {
        super(data);
        this.id = 'frozen_solid';
        this.name = nodeNames[this.id];
        this.position = 3;
        this.max_level = 1;
        this.upgrade_type = 'glacite_powder';
        this.requires = [];
        this.positionType = 'horizontal_line';
    }

    perk() {
        return [
            `§7Gain §a2x §bGlacite Powder §7from killing mobs in the §bGlacite Tunnels §7and §bGlacite Mineshafts§7.`
        ];
    }
}

class HungryForMore extends Node {
    constructor(data) {
        super(data);
        this.id = 'hungry_for_more';
        this.name = nodeNames[this.id];
        this.position = 4;
        this.max_level = 50;
        this.upgrade_type = 'glacite_powder';
        this.requires = [];
        this.positionType = 'top';
    }

    get upgradeCost() {
        const nextLevel = this.level + 1;

        return nextLevel + 1;
    }

    perk(level) {
        const val = level * 1;

        return [
            `§7Gain a §a${val}% §7chance to spawn §a1 §7additional §bFrozen Corpse §7when you enter a §bGlacite Mineshaft§7.`
        ];
    }
}

class Excavator extends Node {
    constructor(data) {
        super(data);
        this.id = 'excavator';
        this.name = nodeNames[this.id];
        this.position = 5;
        this.max_level = 50;
        this.upgrade_type = 'glacite_powder';
        this.requires = [];
        this.positionType = 'horizontal_line';
    }

    get upgradeCost() {
        const nextLevel = this.level + 1;

        return nextLevel + 1;
    }

    perk(level) {
        const val = level * 0.5;

        return [`§9Suspicious Scraps §7are §a${val}% §7more likely to contain a fossil.`];
    }
}

class RagsOfRiches extends Node {
    constructor(data) {
        super(data);
        this.id = 'rags_of_riches';
        this.name = nodeNames[this.id];
        this.position = 6;
        this.max_level = 1;
        this.upgrade_type = 'glacite_powder';
        this.requires = [];
        this.positionType = 'top';
    }

    perk(level) {
        const val = level * 2;

        return [
            `§7Grants §a+${val} §6${SYMBOLS.mining_fortune} Mining Fortune §7while mining inside a §bGlaite Mineshaft`
        ];
    }
}

class HazardousMiner extends Node {
    constructor(data) {
        super(data);
        this.id = 'hazardous_miner';
        this.name = nodeNames[this.id];
        this.position = 7;
        this.max_level = 1;
        this.upgrade_type = null;
        this.requires = [''];
        this.nodeType = 'pickaxe_ability';
        this.positionType = 'left_ability';
    }

    get upgradeCost() {
        return 0;
    }

    perk() {
        const boost = [40, 40, 40][this.pickaxeAbilityLevel - 1];
        const duration = [16.5, 16.5, 16.5][this.pickaxeAbilityLevel - 1];
        const radius = [20, 20, 20][this.pickaxeAbilityLevel - 1];
        const cooldown = [140, 140, 140][this.pickaxeAbilityLevel - 1];
        return [
            '§6Pickaxe Ability: Hazardous Miner',
            `§7Grants §a+${boost} §6${SYMBOLS.mining_speed} Mining Speed §7for §a${duration}s §7for each enemy within §a${radius} §7blocks`,
            `§8Cooldown: §a${cooldown}s`,
            '',
            '§8Pickaxe Abilities apply to all of your pickaxes. You can select a Pickaxe Ability from your Heart of the Mountain.',
            '',
            '§8Upgrade your Pickaxe Abilities by unlocking §cPeak of the Mountain §8in this menu!'
        ];
    }
}

class Surveyor extends Node {
    constructor(data) {
        super(data);
        this.id = 'surveyor';
        this.name = nodeNames[this.id];
        this.position = 11;
        this.max_level = 20;
        this.upgrade_type = 'glacite_powder';
        this.requires = [];
        this.positionType = 'vertical_line';
    }

    perk(level) {
        const val = level * 0.75;

        return [
            `§7Increases your chance of finding a §bGlacite Mineshaft §7when mining in the §bGlacite Tunnels §7by §a+${val}%§7.`
        ];
    }
}

class SubzeroMining extends Node {
    constructor(data) {
        super(data);
        this.id = 'subzero_mining';
        this.name = nodeNames[this.id];
        this.position = 13;
        this.max_level = 100;
        this.upgrade_type = 'glacite_powder';
        this.requires = [];
        this.positionType = 'vertical_line';
    }

    perk(level) {
        const val = level * 1;

        return [`§7Grants §a+${val} §6${SYMBOLS.mining_fortune} Mining Fortune §7when mining §bGlacite§7.`];
    }
}

class EagerAdventurer extends Node {
    constructor(data) {
        super(data);
        this.id = 'eager_adventurer';
        this.name = nodeNames[this.id];
        this.position = 15;
        this.max_level = 50;
        this.upgrade_type = 'glacite_powder';
        this.requires = [];
        this.positionType = 'vertical_line';
    }

    perk(level) {
        const val = level * 2;

        return [`§7Grants §a+${val} §6${SYMBOLS.mining_speed} Mining Speed §7when inside the §bGlacite Mineshafts§7.`];
    }
}

class KeenEye extends Node {
    constructor(data) {
        super(data);
        this.id = 'keen_eye';
        this.name = nodeNames[this.id];
        this.position = 19;
        this.max_level = 1;
        this.upgrade_type = 'glacite_powder';
        this.requires = [];
        this.positionType = 'left_perk';
    }

    perk() {
        return [
            `§7Whenever you enter a §bGlacite Mineshaft §7one highlighted Hard Stone §7will contian §a+250 §bGlacite Powder§7.`
        ];
    }
}

class WarmHearted extends Node {
    constructor(data) {
        super(data);
        this.id = 'warm_hearted';
        this.name = nodeNames[this.id];
        this.position = 20;
        this.max_level = 50;
        this.upgrade_type = 'glacite_powder';
        this.requires = [];
        this.positionType = 'cross';
    }

    perk(level) {
        const val = level * 0.2;

        return [`§7Grants §a+${val} §b${SYMBOLS.cold_resistence} Cold Resistence§7.`];
    }
}

class DustCollector extends Node {
    constructor(data) {
        super(data);
        this.id = 'dust_collector';
        this.name = nodeNames[this.id];
        this.position = 21;
        this.max_level = 20;
        this.upgrade_type = 'glacite_powder';
        this.requires = [];
        this.positionType = 'horizontal_line';
    }

    perk(level) {
        const val = level * 1;

        return [`§7Receive §a${val}% §7more §fFossil Dust §7from all sources.`];
    }
}

class DailyGrind extends Node {
    constructor(data) {
        super(data);
        this.id = 'daily_grind';
        this.name = nodeNames[this.id];
        this.position = 22;
        this.max_level = 100;
        this.upgrade_type = 'glacite_powder';
        this.requires = [];
        this.positionType = 'cross';
    }

    perk() {
        const val = 50;

        return [
            `§7Your first daily commission in each Mining Zone grants bonus powder: `,
            ``,
            `§2Dwarven Mines: §a+${val} §2Mithril Powder`,
            `§5Crystal Hollows: §a+${val} §dGemstone Powder`,
            `§bGlacite Tunnels: §a+${val} §bGlacite Powder`
        ];
    }
}

class StrongArm extends Node {
    constructor(data) {
        super(data);
        this.id = 'strong_arm';
        this.name = nodeNames[this.id];
        this.position = 23;
        this.max_level = 100;
        this.upgrade_type = 'glacite_powder';
        this.requires = [];
        this.positionType = 'horizontal_line';
    }

    perk(level) {
        const val = level * 5;

        return [`§7Gain §a+${val} §6${SYMBOLS.mining_speed} Mining Speed §7when mining Tungsten or Umber.`];
    }
}

class NoStoneUnturned extends Node {
    constructor(data) {
        super(data);
        this.id = 'no_stone_unturned';
        this.name = nodeNames[this.id];
        this.position = 24;
        this.max_level = 50;
        this.upgrade_type = 'glacite_powder';
        this.requires = [];
        this.positionType = 'cross';
    }

    perk(level) {
        const val = level * 0.5;

        return [
            `§7Increases your chances of finding a §9Suspicious Scrap §7when mining in a §bGlacite Mineshaft by §a${val}%§7.`
        ];
    }
}

class MineshaftMayhem extends Node {
    constructor(data) {
        super(data);
        this.id = 'mineshaft_mayhem';
        this.name = nodeNames[this.id];
        this.position = 25;
        this.max_level = 1;
        this.upgrade_type = 'glacite_powder';
        this.requires = [];
        this.positionType = 'right_perk';
    }

    perk() {
        return [
            `§7Every time your enter a §bGlacite Mineshaft§7, you receive a random buff.`,
            ``,
            `§7Possible Buffs`,
            `§8 ■ §a+5% §7chance to find a §9Suspicious Scrap§7.`,
            `§8 ■ §7Gain §a100 §6${SYMBOLS.mining_speed} Mining Speed§7.`,
            `§8 ■ §7Gain §a200 §6${SYMBOLS.mining_fortune} Mining Fortune§7.`,
            `§8 ■ §7Gain §a+10 §b${SYMBOLS.cold_resistence} Cold Resistence§7.`,
            `§8 ■ §7Reduce Pickaxe Ability cooldown by §a25%§7.`
        ];
    }
}

const nodeClasses = {
    // HOTM 10
    gemstone_infusion: GemstoneInfusion,
    gifts_from_the_departed: GiftsFromTheDeparted,
    frozen_solid: FrozenSolid,
    hungry_for_more: HungryForMore,
    excavator: Excavator,
    rags_of_riches: RagsOfRiches,
    hazardous_miner: HazardousMiner,
    // HOTM 9
    surveyor: Surveyor,
    subzero_mining: SubzeroMining,
    eager_adventurer: EagerAdventurer,
    // HOTM 8
    keen_eye: KeenEye,
    warm_hearted: WarmHearted,
    dust_collector: DustCollector,
    daily_grind: DailyGrind,
    strong_arm: StrongArm,
    no_stone_unturned: NoStoneUnturned,
    mineshaft_mayhem: MineshaftMayhem,
    // HOTM 7
    mining_speed_2: MiningSpeed2,
    powder_buff: PowderBuff,
    mining_fortune_2: MiningFortune2,
    // HOTM 6
    vein_seeker: VeinSeeker,
    lonesome_miner: LonesomeMiner,
    professional: Professional,
    mole: Mole,
    fortunate: Fortunate,
    great_explorer: GreatExplorer,
    maniac_miner: ManiacMiner,
    // HOTM 5
    goblin_killer: GoblinKiller,
    special_0: PeakOfTheMountain,
    star_powder: StarPowder,
    // HOTM 4
    daily_effect: SkyMall,
    mining_madness: MiningMadness,
    mining_experience: SeasonedMineman,
    efficient_miner: EfficientMiner,
    experience_orbs: Orbiter,
    front_loaded: FrontLoaded,
    precision_mining: PrecisionMining,
    // HOTM 3
    random_event: LuckOfTheCave,
    daily_powder: DailyPowder,
    fallen_star_bonus: Crystallized,
    // HOTM 2
    mining_speed_boost: MiningSpeedBoost,
    titanium_insanium: TitaniumInsanium,
    mining_fortune: MiningFortune,
    forge_time: QuickForge,
    pickaxe_toss: Pickobulus,
    // HOTM 1
    mining_speed: MiningSpeed
};

const HOTM_Tree = {
    1: [null, null, null, 'mining_speed', null, null, null],
    2: [null, 'mining_speed_boost', 'titanium_insanium', 'mining_fortune', 'forge_time', 'pickaxe_toss', null],
    3: [null, 'random_event', null, 'daily_powder', null, 'fallen_star_bonus', null],
    4: [
        'daily_effect',
        'mining_madness',
        'mining_experience',
        'efficient_miner',
        'experience_orbs',
        'front_loaded',
        'precision_mining'
    ],
    5: [null, 'star_powder', null, 'special_0', null, 'goblin_killer', null],
    6: ['vein_seeker', 'lonesome_miner', 'professional', 'mole', 'fortunate', 'great_explorer', 'maniac_miner'],
    7: [null, 'mining_speed_2', null, 'powder_buff', null, 'mining_fortune_2', null],
    8: [
        'keen_eye',
        'warm_hearted',
        'dust_collector',
        'daily_grind',
        'strong_arm',
        'no_stone_unturned',
        'mineshaft_mayhem'
    ],
    9: [null, 'surveyor', null, 'subzero_mining', null, 'eager_adventurer', null],
    10: [
        'gemstone_infusion',
        'gifts_from_the_departed',
        'frozen_solid',
        'hungry_for_more',
        'excavator',
        'rags_of_riches',
        'hazardous_miner'
    ]
};

module.exports = {
    tree: HOTM_Tree,
    nodes: nodeClasses
};
