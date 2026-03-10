const minecraftCommand = require('../../contracts/minecraftCommand.js');
const { ProfileNetworthCalculator } = require('skyhelper-networth');
const { getMuseum } = require('../../../API/functions/getMuseum.js');
const { hypixelRequest } = require('../../../API/utils/scfAPIHandler.js');
const { getUUID } = require('../../contracts/API/PlayerDBAPI.js');
const { formatNumber, formatUsername } = require('../../contracts/helperFunctions.js');
const config = require('#root/config.js').getConfig();
const Logger = require('#root/src/Logger.js');

const FRUIT_PROFILES = [
    'Apple',
    'Banana',
    'Blueberry',
    'Coconut',
    'Cucumber',
    'Grapes',
    'Kiwi',
    'Lemon',
    'Lime',
    'Mango',
    'Orange',
    'Papaya',
    'Peach',
    'Pear',
    'Pineapple',
    'Pomegranate',
    'Raspberry',
    'Strawberry',
    'Tomato',
    'Watermelon',
    'Zucchini'
];

class NetWorthProfileCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'networthprofile';
        this.aliases = ['nwp', 'networthp'];
        this.description = 'Networth of selected profile, or a specific fruit profile.';
        this.options = [
            {
                name: 'username',
                description: 'Minecraft username (optional)',
                required: false
            },
            {
                name: 'profile',
                description: 'Profile fruit name (optional)',
                required: false
            }
        ];
    }

    async onCommand(username, message, channel = 'gc') {
        try {
            const args = this.getArgs(message).filter((arg) => arg !== '');
            let targetUsername = username;
            let profileName = null;

            if (args.length === 1) {
                const oneArgProfile = normalizeFruitProfile(args[0]);
                if (oneArgProfile != null) {
                    profileName = oneArgProfile;
                } else {
                    targetUsername = args[0];
                }
            } else if (args.length >= 2) {
                targetUsername = args[0];
                profileName = normalizeFruitProfile(args[1]);
                if (profileName == null) {
                    return this.send(`/${channel} Invalid profile. Use one of: ${FRUIT_PROFILES.join(', ')}`);
                }
            }

            const uuidResponse = await getUUID(targetUsername, true);
            const targetUuid = uuidResponse?.uuid;
            const resolvedUsername = uuidResponse?.username ?? targetUsername;

            if (!targetUuid) {
                return this.send(`/${channel} Invalid username provided.`);
            }

            const profilesResponse = await hypixelRequest(
                `https://api.hypixel.net/v2/skyblock/profiles?key=${config.API.hypixelAPIkey}&uuid=${targetUuid}`
            );

            const profiles = profilesResponse?.profiles ?? [];
            if (profiles.length === 0) {
                return this.send(`/${channel} ${resolvedUsername} has no SkyBlock profiles.`);
            }

            const profileData =
                profileName == null
                    ? profiles.find((profile) => profile?.selected) || null
                    : profiles.find(
                          (profile) => (profile?.cute_name ?? '').toLowerCase() === profileName.toLowerCase()
                      );

            if (profileData == null) {
                if (profileName == null) {
                    return this.send(`/${channel} ${resolvedUsername} does not have a selected profile.`);
                }

                return this.send(`/${channel} ${resolvedUsername} does not have the ${profileName} profile.`);
            }

            const resolvedProfileName = profileData?.cute_name ?? profileName ?? 'Selected';

            const profile = profileData?.members?.[targetUuid];
            if (profile == null) {
                return this.send(`/${channel} ${resolvedUsername} is not on that profile.`);
            }

            remapProfileInventory(profile);

            const museumData = await getMuseum(profileData.profile_id, targetUuid).catch(() => {
                return { museum: null, museumData: null };
            });

            const personalBank = profileData?.bank_account;
            const coopBank = profileData?.banking?.balance || 0;
            const coinsTotal = coopBank + (personalBank || 0);

            const networthManager = new ProfileNetworthCalculator(profile, museumData?.museum, coinsTotal);
            const networthProfile = await networthManager.getNetworth();

            if (networthProfile.noInventory === true) {
                return this.send(`/${channel} ${resolvedUsername} has an Inventory API off!`);
            }

            const displayName = formatUsername(resolvedUsername, profileData?.game_mode);
            const networth = formatNumber(networthProfile.networth);
            const unsoulboundNetworth = formatNumber(networthProfile.unsoulboundNetworth);
            const purse = formatNumber(networthProfile.purse);
            const museum = museumData?.museum ? formatNumber(networthProfile.types.museum?.total ?? 0) : 'N/A';

            let bankingData = 'N/A';
            if (Object.entries(profileData?.members ?? {}).length == 1) {
                if (profileData?.banking?.balance != undefined) {
                    bankingData = formatNumber(coopBank);
                }
            } else {
                let coopLabel = 'N/A';
                let personalLabel = 'N/A';

                if (profileData?.banking?.balance != undefined) {
                    coopLabel = formatNumber(coopBank);
                }
                if (personalBank != undefined) {
                    personalLabel = formatNumber(personalBank);
                }

                bankingData = `${coopLabel} / ${personalLabel}`;
            }

            this.send(
                `/${channel} ${displayName}'s ${resolvedProfileName} Networth is ${networth} | Unsoulbound Networth: ${unsoulboundNetworth} | Purse: ${purse} | Bank: ${bankingData} | Museum: ${museum}`
            );
        } catch (error) {
            Logger.warnMessage(error);
            this.send(`/${channel} [ERROR] ${error}`);
        }
    }
}

function normalizeFruitProfile(profileName) {
    if (typeof profileName !== 'string') {
        return null;
    }

    const normalized = profileName.trim().toLowerCase();
    if (normalized.length === 0) {
        return null;
    }

    return FRUIT_PROFILES.find((fruit) => fruit.toLowerCase() === normalized) ?? null;
}

function remapProfileInventory(profile) {
    profile.coin_purse = profile?.currencies?.coin_purse;

    profile.inv_armor = profile?.inventory?.inv_armor;
    profile.equipment_contents = profile?.inventory?.equipment_contents;
    profile.wardrobe_contents = profile?.inventory?.wardrobe_contents;
    profile.inv_contents = profile?.inventory?.inv_contents;
    profile.ender_chest_contents = profile?.inventory?.ender_chest_contents;
    profile.personal_vault_contents = profile?.inventory?.personal_vault_contents;

    profile.backpack_icons = profile?.inventory?.backpack_icons;
    profile.backpack_contents = profile?.inventory?.backpack_contents;

    profile.talisman_bag = profile?.inventory?.bag_contents?.talisman_bag;
    profile.fishing_bag = profile?.inventory?.bag_contents?.fishing_bag;
    profile.potion_bag = profile?.inventory?.bag_contents?.potion_bag;
    profile.sacks_bag = profile?.inventory?.bag_contents?.sacks_bag;

    profile.candy_inventory_contents = profile?.shared_inventory?.candy_inventory_contents;
    profile.carnival_mask_inventory_contents = profile?.shared_inventory?.carnival_mask_inventory_contents;
}

module.exports = NetWorthProfileCommand;
