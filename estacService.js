const Parser = require("rss-parser");
const axios = require("axios");
const { estacEmbed } = require("./embedStyle");

const parser = new Parser();

const posted = new Set();

// 📰 NEWS ESTAC
async function getNews(channel) {
    const feed = await parser.parseURL(
        "https://news.google.com/rss/search?q=ESTAC+Troyes&hl=fr&gl=FR&ceid=FR:fr"
    );

    for (const item of feed.items.slice(0, 5)) {
        if (!item.link || posted.has(item.link)) continue;
        posted.add(item.link);

        await channel.send({
            embeds: [{
                ...estacEmbed(),
                title: "📰 Actualité ESTAC Troyes",
                url: item.link,
                description: item.title
            }]
        });
    }
}

// ⚽ LIVE ESTAC (filtré FRANCE uniquement)
async function getLive(channel) {
    const res = await axios.get(
        "https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=ESTAC%20Troyes"
    );

    const team = res.data?.teams?.find(t =>
        t.strCountry === "France"
    );

    if (!team) return;

    await channel.send({
        embeds: [{
            ...estacEmbed(),
            title: "⚽ ESTAC Troyes LIVE",
            description:
                `🏟️ Stade : ${team.strStadium || "Stade de l'Aube"}\n` +
                `🇫🇷 Pays : France\n` +
                `⚽ Club : ${team.strTeam}`
        }]
    });
}

// 📅 CALENDRIER
async function getCalendar(channel) {
    const res = await axios.get(
        "https://www.thesportsdb.com/api/v1/json/3/eventsnext.php?id=133602"
    );

    const events = res.data?.events?.slice(0, 5);
    if (!events) return;

    let desc = "";

    for (const m of events) {
        desc += `⚽ ${m.strEvent} — ${m.dateEvent}\n`;
    }

    await channel.send({
        embeds: [{
            ...estacEmbed(),
            title: "📅 Calendrier ESTAC Troyes",
            description: desc
        }]
    });
}

module.exports = { getNews, getLive, getCalendar };