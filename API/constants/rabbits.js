function getRabbitRarity(rabbit){
    let rabbit_rarity = rabbits[rabbit];

    if(rabbit_rarity == undefined){
        console.log(`Found unknown rabbit: ${rabbit}`)
        return "UNKNOWN";
    }
    return rabbit_rarity;
}

let rabbits = {};

let common_rabbits = [
    "aaron", "able", "acker", "alfie", "alice", "almond_amaretto", "angus", "annabelle", "archie", "arnie", "audi", "augustus", "baby", "badger", "bagel", "baldwin", "baloo", "barney", "bartholomew", "basket", "baxter", "beatrice", "bertha", "bibsy", "billy", "bindi", "binky", "blake", "bob", "bramble", "breeze", "brian", "brie", "bronson", "brooks", "bruce", "bruno", "bud", "bugster", "bugsy", "buttercream_blossom", "cadet", "callie", "chase", "chester", "chip", "chomper", "chompsky", "claude", "cocoa_comet", "collin", "copper", "cottontail", "cricket", "cuddles", "cupcake", "delboy", "delilah", "demi", "digger", "duchess", "dulce_drizzle", "dusty", "ellie", "emerson", "espresso_eclair", "fergie", "fievel", "fluffy", "francine", "frank", "frankie", "fudge", "fuzzy", "george", "ginger", "ginny", "gizmo", "gloria", "gouda", "gracie", "guinness", "gunther", "hadley", "harley", "hefner", "heidie", "herbie", "hershey", "hondo", "hopper", "huck", "hugo", "humphrey", "hunter", "iggy", "indie", "jake", "james", "jammer", "jasmine", "jazmin", "jeffery", "joey", "jonah", "josephine", "lenny", "lily", "lone_ranger", "lotte", "louie", "mandy", "marlow", "maui", "max", "mickey", "miles", "milly", "mochi", "molly", "mona", "moody", "mookie", "mopsy", "morris", "natalie", "ned", "nibbles", "niko", "niza", "nutmeg", "oletta", "oliver", "olivette", "olivier", "ollie", "paddy", "patch", "pebbles", "penny", "peony", "petunia", "pickles", "pinky", "poppy", "porter", "quentin", "razzie", "reginald", "remi", "ressie", "ricky", "riley", "rolf", "rosco", "ross", "rowdy", "ruben", "rupert", "ryder", "sassy", "scooter", "scotch", "scout", "scuba", "selene", "skippe", "smokey", "sniffles", "snoppy", "snuffy", "sophie", "sorbet", "spencer", "spot", "stanley", "stuart", "suri", "tagalong", "teddy", "thalai", "theo", "theodore", "thumper", "ticky", "tobi", "william", "winston", "zack"
];

for(let rabbit of common_rabbits){
    rabbits[rabbit] = "COMMON";
}

let uncommon_rabbits = [
    "abigail", "alexa", "alexander", "alpaca", "amazon", "ashes", "asterix", "bambam", "bandit", "barcode", "benji", "bilbo", "blossom", "blueberry", "brutus", "bubbles", "buckwheat", "buffalo", "bugs", "bumper", "buster", "butters", "candi", "carter", "casper", "", "cassidy", "charmin", "chewy", "chilli", "chubby", "cloudy", "cookie", "cooper", "cotton", "cotton_puff", "cottonball", "dalton", "dandelion", "darla", "dash", "demarcus", "demetrious", "destiny", "domino", "eastwood", "ella", "fitch", "flip_flop", "forrest", "fudge_fountain", "gadget", "gee_gee", "ginger_glaze", "goofy", "harmony", "honey_hazelnut", "hop_a_long", "icing_ivy", "irena", "jasmine_jello", "jazz", "jelly_bean", "kobi", "leopold", "lulu", "maybelline", "milo", "morgan", "oakley", "obelix", "oreo", "otto", "ozwald", "pancake", "patches", "penelope", "pepsi", "pillsbury", "polka_dot", "porsche", "pretzel", "quincy", "raven", "ringo", "rusty", "sargent", "seinfield", "snoopy", "sprinkles", "stewart", "sweetpea", "sylvester", "toby", "trixie", "una", "wadsworth", "waffle"
];

for(let rabbit of uncommon_rabbits){
    rabbits[rabbit] = "UNCOMMON";
}

let rare_rabbits = [
    "aladdin", "aloysius", "barbie", "bishop", "blackberry", "blackjack", "bugatti", "bun_bun", "cajun", "caramel", "casanova", "chevy", "cinnamon", "crystal", "dallas", "draco", "easter", "elvis", "figaro", "frodo", "gremlin", "honey", "hope", "hyde", "jasper", "jynx", "kiwi_kiss", "lavender_lemon", "linus", "maple_mirage", "midnight", "monalisa", "murphy", "neptune", "nougat_nebula", "olympe", "onyx", "orange_obsidian", "orlando", "paddington", "peanut", "pepper", "phantom", "popcorn", "pride", "pumpkin", "river", "sage", "snowball", "spirit", "spooky", "stormy", "sunny", "tornado", "tricky", "uncle_buck", "vlad", "wesson", "widget", "willow", "zero"
];

for(let rabbit of rare_rabbits){
    rabbits[rabbit] = "RARE";
}

let epic_rabbits = [
    "ace", "achilles", "alpine", "angel", "calypso", "comet", "gatsby", "jedi", "ken", "kiera", "kodo", "merlin", "peppermint_pearl", "prince", "punch", "quince_quark", "rambo", "raspberry_ripple", "simba", "strawberry_swirl", "thor", "toffee_tulip", "trix", "tubro"
];

for(let rabbit of epic_rabbits){
    rabbits[rabbit] = "EPIC";
}

let legendary_rabbits = [
    "apollo", "april", "atlas", "echo", "general", "houdini", "magic", "mystic", "nova", "shadow", "solomon", "storm", "ube_unicorn", "vanilla_vortex", "walnut_whirl", "xoco_xanudu", "yogurt_yucca"
];

for(let rabbit of legendary_rabbits){
    rabbits[rabbit] = "LEGENDARY";
}

let mythic_rabbits = [
    "dante", "einstein", "galaxy", "king", "napoleon", "zest_zephyr", "zorro"
];

for(let rabbit of mythic_rabbits){
    rabbits[rabbit] = "MYTHIC";
}

module.exports = {
    getRabbitRarity: getRabbitRarity,
    rabbits: rabbits,
    common: common_rabbits,
    uncommon: uncommon_rabbits,
    rare: rare_rabbits,
    epic: epic_rabbits,
    legendary: legendary_rabbits,
    mythic: mythic_rabbits
};