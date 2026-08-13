
const minecraftCommand = require('../../contracts/minecraftCommand.js');
const { getLatestProfile } = require('../../../API/functions/getLatestProfile.js');
const config = require('#root/config.js').getConfig();
const { formatUsername } = require('../../contracts/helperFunctions.js');
const { renderLore } = require('../../contracts/renderItem.js');
const { uploadImage } = require('../../contracts/API/imgurAPI.js');
const Logger = require('#root/src/Logger.js');

class RiftCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'rift';
        this.aliases = [];
        this.description = "Shows the player's Rift stats.";
        this.options = [
            {
                name: 'username',
                description: 'Minecraft username',
                required: false
            }
        ];
    }

    formatSeconds(totalSeconds) {
        totalSeconds = Math.floor(totalSeconds ?? 0);

        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m ${seconds}s`;
        }
        if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        }
        return `${seconds}s`;
    }

    async onCommand(username, message, channel = 'gc') {
        try {
            username = this.getArgs(message)[0] || username;

            const data = await getLatestProfile(username);

            username = formatUsername(username, data.profileData?.game_mode);

            let rift = data?.profile?.rift;
            if (rift == undefined) {
                throw "Player hasn't visited the Rift.";
            }

            let motes = data?.profile?.currencies?.motes_purse ?? 0;
            let lifetimeMotes = data?.profile?.player_stats?.rift?.lifetime_motes_earned ?? 0;
            let visits = data?.profile?.player_stats?.rift?.visits ?? 0;

            let enigmaSouls = rift?.enigma?.found_souls?.length ?? 0;
            let foundCats = rift?.dead_cats?.found_cats?.length ?? 0;
            let unlockedEyes = rift?.wither_cage?.killed_eyes?.length ?? 0;
            let grubberStacks = rift?.castle?.grubber_stacks ?? 0;
            let secondsSitting = rift?.village_plaza?.lonely?.seconds_sitting ?? 0;

            let Name = `§5${username}'s Rift Stats:`;
            let Lore = [];

            Lore.push(`§f`);
            Lore.push(`§dMotes§7: §f${motes.toLocaleString()}`);
            Lore.push(`§dLifetime Motes§7: §f${lifetimeMotes.toLocaleString()}`);
            Lore.push(`§dVisits§7: §f${visits.toLocaleString()}`);
            Lore.push(`§dTime sitting with §f[NPC]§7: §f${this.formatSeconds(secondsSitting)}`); //here the [NPC] is the weirdly named npc with the obfuscated name
            Lore.push(`§f`);
            Lore.push(`§dEnigma Souls§7: §f${enigmaSouls}§7/§f52`);
            Lore.push(`§dFound Cats§7: §f${foundCats}§7/§f9`);
            Lore.push(`§dUnlocked Eyes§7: §f${unlockedEyes}§7/§f7`);
            Lore.push(`§dGrubber Stacks§7: §f${grubberStacks}§7/§f5`);
            Lore.push(`§f`);

            const renderedItem = await renderLore(Name, Lore);

            const upload = await uploadImage(renderedItem);

            if (!config.minecraft.commands.integrate_images) {
                this.send(
                    `/${channel} ${username}'s Rift Stats: ${motes.toLocaleString()} Motes | ${visits} Visits. Full response in Discord.`
                );

                this.sendDiscordFollowup(channel, upload.data.link, [renderedItem]);
                return;
            }

            this.send(`/${channel} ${username}'s Rift stats: ${upload.data.link}`);
        } catch (error) {
            Logger.warnMessage(error);
            this.send(`/${channel} [ERROR] ${error}`);
        }
    }
}

module.exports = RiftCommand;
