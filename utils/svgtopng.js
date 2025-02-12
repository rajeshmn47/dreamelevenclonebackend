var convertapi = require('convertapi')('XmU6isIR42SJfsgf');
const flagURLs = require("country-flags-svg");
const fs = require('fs');
const path = require('path');
const data = require('./flags.json');

const countries = ['west indies']

async function convertpng(team) {
  let flagUrl = flagURLs.findFlagUrlByCountryName(
    team
  );
  convertapi.convert('png', { File: flagUrl })
    .then(function (result) {
      //console.log("Converted file url: " + result.file.url);
      let baseDir = path.join(__dirname, '../utils/');
      fs.open(`${baseDir}flags.json`, 'w+', (err, desc) => {
        if (!err, desc) {
          //console.log(data, 'data');
          var json = JSON.parse(JSON.stringify(data));
          json.flags.push({
            "teamname": team,
            "flag": result.file.url
          });
          fs.writeFile(desc, JSON.stringify(json)
            , (err) => {
              // Rest of your code
              if (err) throw err;
              //console.log('Results Received');
            })
        }
      })
    })
}
async function addimages() {
  console.log(countries.length, 'allcountries')
  for (let i = 0; i < countries.length; i++) {
    console.log(countries[i], 'country name')
    await convertpng(countries[i])
  }
}
addimages();
//convertpng('india')