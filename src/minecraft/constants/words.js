const words = [
    "Accessory",
    "Alloy",
    "Amber",
    "Amethyst",
    "Aquamarine",
    "Artifact",
    "Astraea",
    "Auction",
    "Aurora",
    "Barn",
    "Bazaar",
    "Belt",
    "Bingo",
    "Bits",
    "Blaze",
    "Bonzo",
    "Boots",
    "Catalyst",
    "Charm",
    "Chestplate",
    "Chronomicon",
    "Chum",
    "Citrine",
    "Cloak",
    "Coin",
    "Crimson",
    "Cropie",
    "Derpy",
    "Diamond",
    "Diana",
    "Divan",
    "Dungeon",
    "Dwarven",
    "Ectoplasm",
    "Emerald",
    "End",
    "Enderman",
    "Essence",
    "Farm",
    "Felthorn",
    "Fermento",
    "Fervor",
    "Forge",
    "Garden",
    "Gemstone",
    "Ghast",
    "Glacite",
    "Glossy",
    "Gloves",
    "Gold",
    "Goldor",
    "Golem",
    "Griffin",
    "Heirloom",
    "Hellfire",
    "Helmet",
    "Hex",
    "Hollow",
    "Hollows",
    "Hyperion",
    "Inferno",
    "Infusion",
    "Jade",
    "Jasper",
    "Jawbus",
    "Jerry",
    "Juju",
    "Kuudra",
    "Leggings",
    "Livid",
    "Maxor",
    "Medal",
    "Melon",
    "Minion",
    "Mithril",
    "Necklace",
    "Necron",
    "Nether",
    "Obsidian",
    "Onyx",
    "Opal",
    "Park",
    "Paul",
    "Peridot",
    "Pet",
    "Prismarine",
    "Reaper",
    "Recombobulator",
    "Reforge",
    "Relic",
    "Revenant",
    "Rift",
    "Ring",
    "Ruby",
    "Rune",
    "Sack",
    "Sadan",
    "Sapphire",
    "Scarf",
    "Scatha",
    "Scorpius",
    "Scroll",
    "Scylla",
    "Slayer",
    "Sludge",
    "Spider",
    "Squash",
    "Squid",
    "Storm",
    "Sulphur",
    "Sven",
    "Talisman",
    "Tarantula",
    "Terminator",
    "Terror",
    "Thorn",
    "Thunder",
    "Topaz",
    "Valkyrie",
    "Vanquisher",
    "Voidgloom",
    "Warden",
    "Wither",
    "Yeti",
    "Zealot",
];

function getRandomWord(length = undefined) {
    length = undefined;
    if (length !== undefined) {
        const filteredWords = words.filter((word) => word.length == length);

        if (filteredWords.length === 0) {
            // eslint-disable-next-line no-throw-literal
            throw `No words found with the ${length} characters.`;
        }

        return filteredWords[Math.floor(Math.random() * filteredWords.length)];
    } else {
        return words[Math.floor(Math.random() * words.length)];
    }
}

function scrambleWord(word) {
    const chars = word.split('');

    for (let i = chars.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    return word === chars.join('') ? scrambleWord(word) : chars.join('');
}

module.exports = { getRandomWord, scrambleWord };
