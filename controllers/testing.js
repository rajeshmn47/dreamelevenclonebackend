const Match = require("../models/match");
const request = require("request");
const axios = require("axios");
const Contest = require("../models/contest");
const MatchLive = require("../models/match_live_details_new");
const Player = require("../models/players");


async function getplayerImage(name) {
    
    let s = "";
    var config = {
        method: 'get',
        url: `https://cricket.sportmonks.com/api/v2.0/players?filter[lastname]=${name}&api_token=
        fTWhOiGhie6YtMBmpbw10skSjTmSgwHeLg22euC5qLMR1oT1eC6PRc8sEulv`,
        headers: { }
      };
      
     let a=await axios(config)
      .catch(function (error) {
        console.log(error);
      });
  return a.data.data[0].image_path;

}


async function getnames(){
  let names=['sachin','ganguly','dravid','rahul']
  for (let x of names) {
    let seu=await getplayerImage(x)
    console.log(seu)
  }
}

getnames()