const Parser = require("rss-parser");
const axios = require("axios");

const parser = new Parser();

const posted = new Set();

// ----------------------
// NEWS ESTAC (STABLE)
// ----------------------
async function getNews(channel) {
    const feed = await parser.parseURL(
        "https://news.google.com/rss/search?q=ESTAC+Troyes&hl=fr&gl=FR&ceid=FR:fr"
    );

    for (const item of feed.items.slice(0, 5)) {
        if (!item.link || posted.has(item.link)) continue;
        posted.add(item.link);

        await channel.send({
            embeds: [{
                title: "📰 ESTAC Troyes",
                url: item.link,
                description: item.title,
                color: 0x1e90ff
            }]
        });
    }
}

// ----------------------
// LIVE ESTAC (SAFE)
// ----------------------
async function getLive(channel) {
    const res = await axios.get(
        "https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=ESTAC%20Troyes"
    );

    const team = res.data?.teams?.find(t =>
        t.strCountry === "France" &&
        t.strTeam.toLowerCase().includes("estac")
    );

    if (!team) return;

    await channel.send({
        embeds: [{
            title: "⚽ ESTAC Troyes (France)",
            description: `Club: ${team.strTeam}\nStade: ${team.strStadium || "Stade de l'Aube"}`,
            color: 0xff6600
        }]
    });
}

// ----------------------
// CALENDRIER (OPTION)
// ----------------------
async function getCalendar(channel) {
    const res = await axios.get(
        "https://www.thesportsdb.com/api/v1/json/3/eventsnext.php?id=133602"
    );

    const events = res.data?.events?.slice(0, 5);

    if (!events) return;

    let text = "";

    for (const m of events) {
        text += `⚽ ${m.strEvent} - ${m.dateEvent}\n`;
    }

    await channel.send({
        embeds: [{
            title: "📅 ESTAC Calendrier",
            description: text,
            color: 0x00ccff
        }]
    });
}

module.exports = { getNews, getLive, getCalendar };