const Parser = require("rss-parser");
const parser = new Parser();

let last = null;

// 🔥 SOURCE UNIQUE STABLE (inclut X + social + news)
const FEED =
"https://news.google.com/rss/search?q=ESTAC+Troyes+site:x.com+OR+instagram.com+OR+facebook.com&hl=fr&gl=FR&ceid=FR:fr";

async function checkSocial(channel) {
    try {
        const feed = await parser.parseURL(FEED);

        const item = feed.items?.find(i =>
            i.title?.toLowerCase().includes("estac") &&
            i.title?.toLowerCase().includes("troyes")
        );

        if (!item) return;

        if (last === item.link) return;
        last = item.link;

        await channel.send({
            embeds: [{
                color: 0x1e90ff,
                title: "📱 ESTAC Social Update (France)",
                url: item.link,
                description: item.title,
                footer: {
                    text: "ESTAC Troyes • Réseaux sociaux"
                },
                timestamp: new Date()
            }]
        });

    } catch (e) {
        console.log("Social error:", e.message);
    }
}

module.exports = { checkSocial };