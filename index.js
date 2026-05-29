require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    SlashCommandBuilder
} = require("discord.js");

const cron = require("node-cron");

const { getNews, getLive, getCalendar } = require("./estacService");
const { checkSocial } = require("./socialService");

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// 📌 COMMANDES
const commands = [
    new SlashCommandBuilder().setName("estac").setDescription("Bot ESTAC Troyes"),
    new SlashCommandBuilder().setName("news").setDescription("News ESTAC"),
    new SlashCommandBuilder().setName("live").setDescription("Live ESTAC"),
    new SlashCommandBuilder().setName("calendrier").setDescription("Calendrier ESTAC")
].map(c => c.toJSON());

// 🔥 READY
client.once("clientReady", async () => {
    console.log(`⚽ ESTAC BOT CLEAN : ${client.user.tag}`);

    await registerCommands();

    run();

    cron.schedule("*/3 * * * *", run);
});

// 🔁 LOOP SAFE
async function run() {
    const channel = await client.channels.fetch(process.env.CHANNEL_ID);

    await safe(() => getNews(channel), "NEWS");
    await safe(() => getLive(channel), "LIVE");
    await safe(() => checkSocial(channel), "SOCIAL");
}

// 🧠 SAFE WRAPPER
async function safe(fn, name) {
    try {
        await fn();
        console.log(`✔ ${name}`);
    } catch (e) {
        console.log(`❌ ${name}:`, e.message);
    }
}

// 📌 COMMANDES DISCORD
client.on("interactionCreate", async i => {
    if (!i.isChatInputCommand()) return;

    const channel = i.channel;

    if (i.commandName === "estac") {
        return i.reply("⚽ ESTAC Troyes Bot actif (France uniquement)");
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

// 🔧 REGISTER
async function registerCommands() {
    const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

    await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
    );

    console.log("✅ Commands OK");
}

client.login(process.env.TOKEN);