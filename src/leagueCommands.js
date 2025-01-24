const axios = require("axios");
const { EmbedBuilder, MessageEmbed } = require('discord.js');
require("dotenv").config();

const RIOT_API_KEY = process.env.RIOT_API_KEY;
let masteryscore;

async function getSummonerInfo(message, summonerName, summonerHash) {
  try {
    const response = await axios.get(
      `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${summonerName}/${summonerHash}?api_key=${RIOT_API_KEY}`
    );
    const summoner = response.data;
    const response2 = await axios.get(
      `https://euw1.api.riotgames.com/lol/champion-mastery/v4/scores/by-puuid/${summoner.puuid}?api_key=${RIOT_API_KEY}`
    );
    const mastery = response2.data;

    return message.channel.send(
      `Summoner name: ${summoner.gameName} , Total Mastery Score: ${mastery}`
    );
  } catch (error) {
    console.error(`Error fetching summoner data: ${error}`);
    message.channel.send("Sorry, I could not fetch the summoner data.");
  }
}

async function getChampionImage(message, name, id) {
  try {
    if (id == 0) {
      id = "0";
    }
    const response = await axios.get(
      `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${name}_${id}.jpg`
    );

    return message.channel.send(
      `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${name}_${id}.jpg`
    );
  } catch (error) {
    console.error(`Error fetching champion data: ${error}`);
    message.channel.send("Sorry, I could not fetch the champion data.");
  }
}

async function getSkinId(message, name, skinName) {
  try {
    const formattedName = skinName
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

    const response = await axios.get(
      `https://ddragon.leagueoflegends.com/cdn/11.20.1/data/en_US/champion/${name}.json`
    );

    const championData = response.data.data[name];
    const skins = championData.skins;
    for (const skin of skins) {
      if (skin.name.toLowerCase() === skinName.toLowerCase()) {
        return skin;
      }
    }

    return null;
  } catch (error) {
    console.error(`Error fetching champion data: ${error}`);
    message.channel.send("Sorry, I could not fetch the champion data. id");
  }
}

async function getPuuid(message, summonerName, summonerHash) {
  try {
    const response = await axios.get(
      `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${summonerName}/${summonerHash}?api_key=${RIOT_API_KEY}`
    );
    const summoner = response.data;
    return summoner.puuid;
  } catch (error) {
    console.error(`Error fetching summoner data: ${error}`);
    message.channel.send("Sorry, I could not fetch the summoner data.");
  }
}

async function getMastery(message, puuid, countId = 3) {
  try {
    const response = await axios.get(
      `https://euw1.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top?count=${countId}&api_key=${RIOT_API_KEY}`
    );

    const champions = await axios.get(
      `https://ddragon.leagueoflegends.com/cdn/15.2.1/data/en_US/champion.json`
    );

    const masteryData = response.data;
    const championData = champions.data.data;
    let matchedChampions = [];

    let count = 1;
    for (let mastery of masteryData) {
      for (let championKey in championData) {
        if (championData[championKey].key == mastery.championId.toString()) {
          matchedChampions.push({
            Top: count,
            name: championData[championKey].name,
            title: championData[championKey].title,
            masterylevel: mastery.championLevel,
            masteryScore: mastery.championPoints,
            image: `http://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championData[championKey].id}_0.jpg`,
            thumbnail: `http://ddragon.leagueoflegends.com/cdn/15.2.1/img/champion/${championData[championKey].image.full}`,
          });
          count++;
        }
      }
    }

    for (let champion of matchedChampions) {
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`Champion: ${champion.name}`)
        .setDescription(`Title: ${champion.title}`)
        .addFields(
          { name: 'Mastery Level', value: champion.masterylevel.toString(), inline: true },
          { name: 'Mastery Score', value: champion.masteryScore.toString(), inline: true }
        )
        .setThumbnail(champion.thumbnail)
        .setTimestamp()
        .setFooter({ text: 'Ben Bot' });

      await message.channel.send({ embeds: [embed] });
    }

    return matchedChampions;
  } catch (error) {
    console.error(`Error fetching mastery data: ${error}`);
    message.channel.send("Sorry, I could not fetch the mastery data.");
  }
}


async function GetDailyChampion() {
  let dailyChampion = await fetchRandomChampion();
  console.log(`Today's champion is: ${dailyChampion}`);
  return dailyChampion;
}

async function fetchRandomChampion() {
  const response = await axios.get(
    `https://ddragon.leagueoflegends.com/cdn/11.20.1/data/en_US/champion.json`
  );
  const champions = response.data.data;
  const championKeys = Object.keys(champions);
  const randomChampionKey =
    championKeys[Math.floor(Math.random() * championKeys.length)];
  return randomChampionKey;
}

module.exports = {
  getSummonerInfo,
  getChampionImage,
  getSkinId,
  getPuuid,
  getMastery,
  GetDailyChampion
};
