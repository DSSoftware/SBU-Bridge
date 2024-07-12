const minecraftCommand = require('../../contracts/minecraftCommand.js');
const { getNetworth } = require('skyhelper-networth');
const { getLatestProfile } = require('../../../API/functions/getLatestProfile.js');
const { formatNumber, formatUsername } = require('../../contracts/helperFunctions.js');

class NetWorthCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'networth';
        this.aliases = ['nw'];
        this.description = 'Networth of specified user.';
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

            username = formatUsername(username, data.profileData?.game_mode);

            let should_cache = true;
            let cache_message = 'Cached';

            if (this.getArgs(message)[1] == 'force') {
                should_cache = false;
                cache_message = 'Refreshed';
            }

            let personal_bank = data?.v2?.profile?.profile?.bank_account;

            let coop_bank = data.profileData?.banking?.balance || 0;

            let coins_total = coop_bank + (personal_bank || 0);

            const profile = await getNetworth(data.profile, coins_total, {
                cache: should_cache,
                onlyNetworth: true,
                museumData: data.museum
            });

            if (profile.noInventory === true) {
                return this.send(`/${channel} ${username} has an Inventory API off!`);
            }

            const networth = formatNumber(profile.networth);
            const unsoulboundNetworth = formatNumber(profile.unsoulboundNetworth);
            const purse = formatNumber(profile.purse);
            const bank = profile.bank ? formatNumber(profile.bank) : 'N/A';
            const museum = data.museum ? formatNumber(profile.types.museum?.total ?? 0) : 'N/A';

            let banking_data = 'N/A';

            if (Object.entries(data.profileData?.members ?? {}).length == 1) {
                // No personal bank, just coop (Solo profile)
                if (data.profileData?.banking?.balance != undefined) {
                    banking_data = formatNumber(coop_bank);
                }
            } else {
                // Coop bank + Personal bank (Coop profile)
                let coop_label = 'N/A';
                let personal_label = 'N/A';

                if (data.profileData?.banking?.balance != undefined) {
                    coop_label = formatNumber(coop_bank);
                }
                if (personal_bank != undefined) {
                    personal_label = formatNumber(personal_bank);
                }

                banking_data = `${coop_label} / ${personal_label}`;
            }

            console.log(
                `/${channel} ${username}'s Networth is ${networth} | Unsoulbound Networth: ${unsoulboundNetworth} | Purse: ${purse} | Bank: ${banking_data} | Museum: ${museum} | ${cache_message}`
            );
        } catch (error) {
            console.log(error);
            this.send(`/${channel} [ERROR] ${error}`);
        }
    }
}

module.exports = NetWorthCommand;
