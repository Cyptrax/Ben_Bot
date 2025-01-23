const axios = require("axios");
require("dotenv").config();

const RIOT_API_KEY = process.env.RIOT_API_KEY;
let masteryscore;

async function getSummonerInfo(message, summonerName, summonerHash) {
  try {
    console.log(
      `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${summonerName}/${summonerHash}?api_key=${RIOT_API_KEY}`
    );
    const response = await axios.get(
      `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${summonerName}/${summonerHash}?api_key=${RIOT_API_KEY}`
    );
    const summoner = response.data;
    console.log(
      `https://euw1.api.riotgames.com/lol/champion-mastery/v4/scores/by-puuid/${summoner.puuid}?api_key=${RIOT_API_KEY}`
    );
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

    console.log(
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

    console.log(
      `https://ddragon.leagueoflegends.com/cdn/11.20.1/data/en_US/champion/${name}.json`
    );
    const response = await axios.get(
      `https://ddragon.leagueoflegends.com/cdn/11.20.1/data/en_US/champion/${name}.json`
    );

    console.log(
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

module.exports = {
  getSummonerInfo,
  getChampionImage,
  getSkinId,
};
