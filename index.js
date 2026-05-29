const {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    SlashCommandBuilder
} = require("discord.js");

const express = require("express");
const cron = require("node-cron");
const Parser = require("rss-parser");
const axios = require("axios");

// ======================
// CONFIG
// ======================

// Railway Variables
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const CHANNEL_ID = process.env.CHANNEL_ID;

// Si tu veux mettre en dur (pas conseillé GitHub)
// const TOKEN = "TOKEN_ICI";
// const CLIENT_ID = "BOT_ID_ICI";
// const CHANNEL_ID = "SALON_ID_ICI";

const parser = new Parser();
const posted = new Set();
let lastSocial = null;

// ======================
// EXPRESS WEB SERVER
// ======================

const app = express();

app.get("/", (req, res) => {
    res.send("⚽ ESTAC Bot en ligne");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🌐 Web server actif : ${PORT}`);
});

// ======================
// DISCORD CLIENT
// ======================

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// ======================
// COMMANDES
// ======================

const commands = [
    new SlashCommandBuilder()
        .setName("estac")
        .setDescription("Bot ESTAC Troyes"),

    new SlashCommandBuilder()
        .setName("news")
        .setDescription("News ESTAC"),

    new SlashCommandBuilder()
        .setName("live")
        .setDescription("Live ESTAC"),

    new SlashCommandBuilder()
        .setName("calendrier")
        .setDescription("Calendrier ESTAC")
].map(c => c.toJSON());

// ======================
// EMBED STYLE
// ======================

function estacEmbed() {
    return {
        color: 0x1e90ff,
        footer: {
            text: "ESTAC Troyes • Bot France"
        },
        timestamp: new Date()
    };
}

// ======================
// NEWS ESTAC
// ======================

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

// ======================
// LIVE ESTAC
// ======================

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

// ======================
// CALENDRIER
// ======================

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

// ======================
// SOCIAL WATCHER
// ======================

async function checkSocial(channel) {

    const FEED =
        "https://news.google.com/rss/search?q=ESTAC+Troyes+site:x.com+OR+instagram.com+OR+facebook.com&hl=fr&gl=FR&ceid=FR:fr";

    try {

        const feed = await parser.parseURL(FEED);

        const item = feed.items?.find(i =>
            i.title?.toLowerCase().includes("estac")
        );

        if (!item) return;

        if (lastSocial === item.link) return;

        lastSocial = item.link;

        await channel.send({
            embeds: [{
                ...estacEmbed(),
                title: "📱 ESTAC Social Update",
                url: item.link,
                description: item.title
            }]
        });

    } catch (e) {
        console.log("Social error:", e.message);
    }
}

// ======================
// SAFE LOOP
// ======================

async function safe(fn, name) {
    try {
        await fn();
        console.log(`✔ ${name}`);
    } catch (e) {
        console.log(`❌ ${name}:`, e.message);
    }
}

async function run() {

    const channel =
        await client.channels.fetch(CHANNEL_ID);

    await safe(() => getNews(channel), "NEWS");
    await safe(() => getLive(channel), "LIVE");
    await safe(() => checkSocial(channel), "SOCIAL");
}

// ======================
// REGISTER COMMANDS
// ======================

async function registerCommands() {

    const rest =
        new REST({ version: "10" }).setToken(TOKEN);

    await rest.put(
        Routes.applicationCommands(CLIENT_ID),
        { body: commands }
    );

    console.log("✅ Slash commands OK");
}

// ======================
// READY
// ======================

client.once("clientReady", async () => {

    console.log(`⚽ Connecté : ${client.user.tag}`);

    await registerCommands();

    run();

    cron.schedule("*/3 * * * *", run);
});

// ======================
// COMMANDES DISCORD
// ======================

client.on("interactionCreate", async i => {

    if (!i.isChatInputCommand()) return;

    const channel = i.channel;

    if (i.commandName === "estac") {
        return i.reply("⚽ ESTAC Troyes Bot actif");
    }

    if (i.commandName === "news") {
        await getNews(channel);
        return i.reply("📰 News envoyées");
    }

    if (i.commandName === "live") {
        await getLive(channel);
        return i.reply("⚽ Live envoyé");
    }

    if (i.commandName === "calendrier") {
        await getCalendar(channel);
        return i.reply("📅 Calendrier envoyé");
    }
});

// ======================
// LOGIN
// ======================

client.login(TOKEN);