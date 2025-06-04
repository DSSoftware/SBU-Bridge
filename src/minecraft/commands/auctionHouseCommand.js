const config = require('../../../config.js');
const { addCommas, timeSince } = require('../../contracts/helperFunctions.js');
const minecraftCommand = require('../../contracts/minecraftCommand.js');
const { renderLore } = require('../../contracts/renderItem.js');
const getRank = require('../../../API/stats/rank.js');
const axios = require('axios');
const { getUUID } = require('../../contracts/API/PlayerDBAPI.js');
const { uploadImage } = require('../../contracts/API/imgurAPI.js');
const { formatNumber } = require('../../contracts/helperFunctions.js');
const Logger = require('#root/src/Logger.js');
const { hypixelRequest } = require('../../../API/utils/scfAPIHandler.js');

class AuctionHouseCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'auction';
        this.aliases = ['ah', 'auctions'];
        this.description = 'Listed Auctions of specified user.';
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

            let string = '';

            const uuid_response = await getUUID(username, true);
            const uuid = uuid_response?.uuid;
            const nick = uuid_response?.username;

            const { hypixelAPIkey } = config.minecraft.API;
            const [auctionResponse, playerResponse] = await Promise.all([
                hypixelRequest(`https://api.hypixel.net/v2/skyblock/auction?key=${hypixelAPIkey}&player=${uuid}`),
                hypixelRequest(`https://api.hypixel.net/v2/player?key=${hypixelAPIkey}&uuid=${uuid}`)
            ]);

            const auctions = auctionResponse?.auctions || [];
            const player = playerResponse?.player || {};

            if (auctions.length === 0) {
                return this.send(`/${channel} This player has no active auctions.`);
            }

            const activeAuctions = auctions.filter((auction) => auction.end >= Date.now());

            let auctions_len = 0;
            let price = 0;
            let images = '';
            let img_array = [];

            if (activeAuctions.length === 0) {
                return this.send(`/${channel} This player has no active auctions.`);
            }

            for (const auction of activeAuctions) {
                let item_price = 0;

                const lore = auction.item_lore.split('\n');

                lore.push('§8§m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯', `§7Seller: ${getRank(player)} ${player.displayname}`);

                if (auction.bin === undefined) {
                    if (auction.bids.length === 0) {
                        lore.push(`§7Starting Bid: §6${addCommas(auction.starting_bid)} coins`, `§7`);
                    } else if (auction.bids.length > 0) {
                        const bidderUUID = auction.bids[auction.bids.length - 1].bidder;
                        const bidderResponse = await hypixelRequest(
                            `https://api.hypixel.net/v2/player?key=${hypixelAPIkey}&uuid=${bidderUUID}`
                        );

                        const bidder = bidderResponse?.player || {};
                        if (bidder === undefined) {
                            // eslint-disable-next-line no-throw-literal
                            throw `Failed to get bidder for auction ${auction.uuid}`;
                        }

                        const { amount } = auction.bids[auction.bids.length - 1];
                        item_price = amount ?? 0;
                        const bidOrBids = auction.bids.length === 1 ? 'bids' : 'bid';

                        lore.push(
                            `§7Bids: §a${auction.bids.length} ${bidOrBids}`,
                            `§7`,
                            `§7Top Bid: §6${amount.toLocaleString()} coins`,
                            `§7Bidder: ${getRank(bidder)} ${bidder.displayname}`,
                            `§7`
                        );
                    }
                } else {
                    lore.push(`§7Buy it now: §6${auction.starting_bid.toLocaleString()} coins`, `§7`);
                    item_price = auction.starting_bid ?? 0;
                }

                lore.push(`§7Ends in: §e${timeSince(auction.end)}`, `§7`, `§eClick to inspect`);

                if (auctions_len == 4) {
                    string += ` (4 out of ${activeAuctions.length})`;
                }
                if (auctions_len < 4) {
                    const renderedItem = await renderLore(`§7${auction.item_name}`, lore);
                    const upload = await uploadImage(renderedItem);
                    
                    img_array.push(renderedItem);
                    images += `\n${upload.data.link}`;

                    string += string === '' ? upload.data.link : ' | ' + upload.data.link;
                }
                auctions_len++;

                price += item_price;
            }

            if (!config.minecraft.commands.integrate_images) {
                this.send(
                    `/${channel} ${nick} has ${auctions_len} auctions totalling ${formatNumber(price, 2)}. Full response in Discord.`
                );
                this.sendDiscordFollowup(channel, images, img_array);
                return;
            }

            this.send(`/${channel} ${`${nick}'s Active Auctions: ${string}`}`);
        } catch (error) {
            Logger.warnMessage(error);
            this.send(`/${channel} [ERROR] ${error}`);
        }
    }
}

module.exports = AuctionHouseCommand;
