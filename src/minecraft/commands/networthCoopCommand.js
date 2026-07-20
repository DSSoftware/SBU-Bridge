const minecraftCommand = require('../../contracts/minecraftCommand.js');
const { getNetworth } = require('../../../API/utils/skykings.js');
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

            const data = await getLatestProfile(username);

            const displayUsernameRaw = await getUsername(data.uuid);
            const displayUsername = formatUsername(displayUsernameRaw ?? username, data.profileData?.game_mode);
            const profileName = data.profileData?.cute_name ?? 'Unknown';
            const members = Object.entries(data.profileData?.members ?? {}).filter(([, memberProfile]) => {
                return memberProfile?.profile?.deletion_notice == null;
            });

            if (members.length === 0) {
                return this.send(`/${channel} ${displayUsername} has no active coop members on this profile.`);
            }

            const coopNetworth = await Promise.all(
                members.map(async ([memberUuid]) => {
                    const memberUsername = await getUsername(memberUuid).catch(() => null);

                    const profile = await getNetworth(
                        {
                            profiles: data.profiles
                        },
                        memberUuid,
                        {
                            profileName: data.profileData?.cute_name,
                            top: 25,
                            includeBank: true,
                            includeAllEntries: false
                        }
                    );

                    const rawNetworth = profile.totals?.networth ?? 0;
                    const purse = profile.totals?.purse ?? 0;
                    const bank = profile.totals?.bank ?? 0;
                    const coopBank = profile.totals?.coop_bank ?? 0;
                    const networth = rawNetworth - coopBank;

                    return {
                        username: memberUsername ?? memberUuid,
                        networth,
                        purse,
                        bank,
                        coopBank,
                        label: `${memberUsername ?? memberUuid}: ${formatNumber(networth)}`
                    };
                })
            );

            const coopBank = coopNetworth.find((member) => member.coopBank > 0)?.coopBank ?? 0;

            const totalCoopNetworth =
                coopNetworth.reduce((total, member) => {
                    return total + member.networth;
                }, 0) + coopBank;

            const coopBankLabel = coopBank > 0 ? formatNumber(coopBank) : 'N/A';

            this.send(
                `/${channel} ${displayUsername}'s Total Coop NW: ${formatNumber(totalCoopNetworth)} | ${coopNetworth.map((member) => member.label).join(' | ')} | Coop Bank: ${coopBankLabel} | Profile: ${profileName}`
            );

            this.send(`/${channel} ${displayUsername}'s Coop NW | ${coopNetworth.join(' | ')}`);
        } catch (error) {
            Logger.warnMessage(error);
            this.send(`/${channel} [ERROR] ${error.message ?? error}`);
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
