const minecraftCommand = require('../../contracts/minecraftCommand.js');
const { ProfileNetworthCalculator } = require('skyhelper-networth');
const { getLatestProfile } = require('../../../API/functions/getLatestProfile.js');
const { getMuseum } = require('../../../API/functions/getMuseum.js');
const { getUsername } = require('../../contracts/API/PlayerDBAPI.js');
const { formatNumber, formatUsername } = require('../../contracts/helperFunctions.js');
const Logger = require('#root/src/Logger.js');

class NetWorthCoopCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'networthcoop';
        this.aliases = ['nwc'];
        this.description = 'Networth of the Coop.';
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
            username = this.getArgs(message)[0] || username;

            const data = await getLatestProfile(username, { museum: true });

            const displayUsername = formatUsername(username, data.profileData?.game_mode);
            const coopBank = data.profileData?.banking?.balance || 0;
            const members = Object.entries(data.profileData?.members ?? {}).filter(([, memberProfile]) => {
                return memberProfile?.profile?.deletion_notice == null;
            });

            if (members.length === 0) {
                return this.send(`/${channel} ${displayUsername} has no active coop members on this profile.`);
            }

            const coopNetworth = await Promise.all(
                members.map(async ([uuid, memberProfile]) => {
                    remapProfileInventory(memberProfile);

                    const memberUsername = await getUsername(uuid);
                    const memberMuseumData = await getMuseum(data.profileData.profile_id, uuid).catch(() => {
                        return { museum: null };
                    });

                    const personalBank = memberProfile?.profile?.bank_account;
                    const coinsTotal = personalBank || 0;

                    const networthManager = new ProfileNetworthCalculator(
                        memberProfile,
                        memberMuseumData?.museum,
                        coinsTotal
                    );

                    const memberNetworth = await networthManager.getNetworth();

                    if (memberNetworth.noInventory === true) {
                        return {
                            label: `${memberUsername ?? uuid}: API off`,
                            networth: 0
                        };
                    }

                    return {
                        label: `${memberUsername ?? uuid}: ${formatNumber(memberNetworth.networth)}`,
                        networth: memberNetworth.networth ?? 0
                    };
                })
            );

            const coopBankLabel = data.profileData?.banking?.balance != undefined ? formatNumber(coopBank) : 'N/A';
            const totalCoopNetworth = coopNetworth.reduce((total, member) => total + member.networth, coopBank);

            this.send(
                `/${channel} ${displayUsername}'s Total Coop NW: ${formatNumber(totalCoopNetworth)} | ${coopNetworth.map((member) => member.label).join(' | ')} | Coop Bank: ${coopBankLabel}`
            );

            this.send(`/${channel} ${displayUsername}'s Coop NW | ${coopNetworth.join(' | ')}`);
        } catch (error) {
            Logger.warnMessage(error);
            this.send(`/${channel} [ERROR] ${error}`);
        }
    }
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

module.exports = NetWorthCoopCommand;
