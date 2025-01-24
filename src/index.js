const { Client, GatewayIntentBits, ChannelType } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  getVoiceConnection,
} = require("@discordjs/voice");

const {
  getSummonerInfo,
  getChampionImage,
  getSkinId,
  getPuuid,
  getMastery,
  GetDailyChampion,
} = require("./leagueCommands");
require("dotenv").config();
const cron = require('node-cron');
const fs = require("fs");
const schedule = require("node-schedule");
const path = require("path");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});



let dailyChampion = null;
(async () => {
  dailyChampion = await GetDailyChampion();
  console.log(`Daily Champion on start: ${dailyChampion}`);
})();


schedule.scheduleJob('0 12 * * *', () => {
  dailyChampion = GetDailyChampion();
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);

  schedule.scheduleJob("*0 * * * *", async () => {
    console.log("Running hour check...");
    const guilds = client.guilds.cache;

    await Promise.all(
      guilds.map(async (guild) => {
        const voiceChannels = guild.channels.cache.filter(
          (channel) => channel.type === ChannelType.GuildVoice
        );
        console.log(`Checking guild: ${guild.name}`);

        for (const channel of voiceChannels.values()) {
          console.log(`Checking channel: ${channel.name}`);
          if (channel.members.size > 0) {
            channel.members.forEach((member) => {
              console.log(`Member: ${member.user.tag}`);
            });

            let hours = new Date().getHours();
            if (hours == 0) {
              hours = 12;
            }
            if (hours > 12) {
              hours = hours - 12;
            }
            for (let i = 0; i < hours; i++) {
              console.log(`Playing sound for hour ${i + 1}`);
              await playSound(channel);
            }
            console.log(`Disconnecting from channel: ${channel.name}`);
            disconnectVoiceChannel(channel);
          } else {
            console.log(`No members in channel: ${channel.name}`);
          }
        }
      })
    );
  });

  schedule.scheduleJob("*/30 * * * *", async () => {
    console.log(`Half uur`);
    const guilds = client.guilds.cache;

    for (const guild of guilds.values()) {
      const voiceChannels = guild.channels.cache.filter(
        (channel) => channel.type === ChannelType.GuildVoice
      );
      console.log(`Checking guild: ${guild.name}`);

      for (const channel of voiceChannels.values()) {
        console.log(`Checking channel: ${channel.name}`);
        if (channel.members.size > 0) {
          console.log(`Found members in channel: ${channel.name}`);
          channel.members.forEach((member) => {
            console.log(`Member: ${member.user.tag}`);
          });
          await playSound(channel);
          // Disconnect after playing sounds
          console.log(`Disconnecting from channel: ${channel.name}`);
          disconnectVoiceChannel(channel);
        } else {
          console.log(`No members in channel: ${channel.name}`);
        }
      }
    }
  });
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content === "!ping") {
    message.channel.send("Pong!");
  } else if (message.content.toLowerCase() === "!bibel") {
    const filePath = path.join(__dirname, "files", "Bibel.txt");
    try {
      await message.channel.send({
        files: [
          {
            attachment: filePath,
            name: "Bibel.txt",
          },
        ],
      });
    } catch (err) {
      console.error(`Error reading file: ${err}`);
      message.channel.send("Sorry, I couldn't read the file.");
    }
  }
  if (message.content === "!yo") {
    const voiceChannel = message.member.voice.channel;

    if (voiceChannel) {
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
      });

      const player = createAudioPlayer();
      const resource = createAudioResource(path.join(__dirname, "sounds", 'yo.ogg'));

      player.play(resource);
      connection.subscribe(player);

      player.on(AudioPlayerStatus.Idle, () => {
        connection.destroy();
      });
    } else {
      message.reply('You need to be in a voice channel to use this command!');
    }
  }

  else if (message.content.toLowerCase() === "!bibel600testdontuse") {
    const filePath = path.join(__dirname, "files", "Bibel.txt");
    try {
      const data = fs.readFileSync(filePath, "utf8");
      const chunks = data.match(/[\s\S]{1,2000}/g); // Split the data into chunks of 2000 characters
      for (const chunk of chunks) {
        await message.channel.send(chunk);
      }
    } catch (err) {
      console.error(`Error reading file: ${err}`);
      message.channel.send("Sorry, I couldn't read the file.");
    }
  }
  if (message.content.startsWith("!summoner")) {
    const args = message.content.split(" ");
    if (args.length < 2) {
      return message.channel.send(
        "Please provide a summoner name and tag separated by #."
      );
    }

    const [summonerName, tag] = args[1].split("#");
    console.log(`Summoner name: ${summonerName}, tag: ${tag}`);
    if (!summonerName || !tag) {
      return message.channel.send(
        "Please provide a summoner name and tag separated by #."
      );
    }

    await getSummonerInfo(message, `${summonerName}`, `${tag}`);
  } else if (message.content.startsWith("!splashart")) {
    const args = message.content.split(" ");
    if (args.length < 3) {
      return message.channel.send(
        "Please provide a champion name and skin name separated by a space."
      );
    }

    let championName = args[1];
    let skinName = args.slice(2).join(" ");

    if (!championName) {
      return message.channel.send("Please provide a champion name.");
    }

    if (!skinName) {
      return message.channel.send("Please provide a skin name.");
    }

    championName = championName
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

    skinName = skinName
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

    const skin = await getSkinId(message, championName, skinName);

    if (!skin) {
      return message.channel.send("Skin not found.");
    }

    await getChampionImage(message, championName, skin.num);
  } else if (message.content.startsWith("!mastery")) {
    const args = message.content.split(" ");
    if (args.length < 2) {
      return message.channel.send(
        "Please provide a summoner name and tag separated by #."
      );
    }

    const [summonerName, tag] = args[1].split("#");
    console.log(`Summoner name: ${summonerName}, tag: ${tag}`);
    if (!summonerName || !tag) {
      return message.channel.send(
        "Please provide a summoner name and tag separated by #."
      );
    }

    const count = args.length > 2 ? parseInt(args[2], 10) : 3;
    if (isNaN(count) || count < 1) {
      return message.channel.send("Please provide a valid number of champions.");
    }

    const puuid = await getPuuid(message, `${summonerName}`, `${tag}`);
    console.log(`Puuid: ${puuid}`);
    await getMastery(message, puuid, count);
  }
  if (message.content.startsWith("!daily")) {
    message.channel.send(`Try to guess the daily champion with !guess`);
  }
  if (message.content.startsWith('!guess ')) {
    const guess = message.content.slice(7).trim().toLowerCase();
    const champion = dailyChampion.toLowerCase();

    if (guess === champion) {
      message.channel.send(`Congratulations! You guessed the champion: ${dailyChampion}`);
    } else {
      let feedback = '';
      for (let i = 0; i < champion.length; i++) {
        if (guess[i] && guess[i] === champion[i]) {
          feedback += guess[i].toUpperCase();
        } else if (champion.includes(guess[i])) {
          feedback += guess[i];
        } else {
          feedback += '_';
        }
      }
      message.channel.send(`Guess feedback: ${feedback}`);
    }
  }
});

async function playSound(channel) {
  try {
    console.log(`Attempting to join voice channel: ${channel.name}`);
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });

    console.log(`Joined voice channel: ${channel.name}`);
    const player = createAudioPlayer();

    const filePath = path.join(__dirname, "sounds", "old-church-bell.ogg");
    if (!fs.existsSync(filePath)) {
      console.error(`Audio file not found: ${filePath}`);
      return;
    }

    const resource = createAudioResource(filePath);

    console.log(`Audio resource created: ${resource}`);
    player.play(resource);
    connection.subscribe(player);

    return new Promise((resolve, reject) => {
      player.on(AudioPlayerStatus.Playing, () => {
        console.log(`Playing sound in channel: ${channel.name}`);
      });

      player.on(AudioPlayerStatus.Idle, () => {
        console.log(`Finished playing sound in channel: ${channel.name}`);
        resolve();
      });

      player.on("error", (error) => {
        console.error(`Error playing sound in channel: ${channel.name}`, error);
        connection.destroy();
        reject(error);
      });
    });
  } catch (error) {
    console.error(`Error joining channel: ${channel.name}`, error);
  }
}

function disconnectVoiceChannel(channel) {
  const connection = getVoiceConnection(channel.guild.id);
  if (connection) {
    connection.destroy();
    console.log(`Disconnected from channel: ${channel.name}`);
  }
}

client.login(process.env.DISCORD_BOT_TOKEN);
