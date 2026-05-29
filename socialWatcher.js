const Parser = require("rss-parser");
const parser = new Parser();

let last = null;

// 🔥 RSS X via Google News (FIABLE)
const FEED =
"https://news.google.com/rss/search?q=ESTAC+Troyes+site:x.com&hl=fr&gl=FR&ceid=FR:fr";

async function checkSocial(channel) {
    try {
        const feed = await parser.parseURL(FEED);

        const item = feed.items?.[0];
        if (!item) return;

        if (last === item.link) return;
        last = item.link;

        await channel.send({
            content: "🐦 ESTAC X (Twitter officiel détecté)",
            embeds: [{
                title: item.title,
                url: item.link,
                description: "Post X ESTAC Troyes (France)",
                color: 0x1e90ff
            }]
        });

    } catch (e) {
        console.log("X error:", e.message);
    }
}

module.exports = { checkSocial };