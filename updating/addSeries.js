const axios = require('axios'); // For making HTTP requests
const Series = require("../models/series"); // Series model to interact with MongoDB
const { getkeys } = require('../utils/crickeys');

// Function to get series for a specific type
async function fetchSeriesByType(type) {
  const options = {
    method: 'GET',
    hostname: 'cricbuzz-cricket.p.rapidapi.com',
    port: null,
    path: `/series/v1/${type}`, // Dynamically set the path based on the series type
    headers: {
      'x-rapidapi-key': '3ddef92f6emsh8301b1a8e1fd478p15bb8bjsnd0bb5446cadc',
      'x-rapidapi-host': 'cricbuzz-cricket.p.rapidapi.com',
    },
  };

  try {
    const key=await getkeys()
    const response = await axios.get(`https://cricbuzz-cricket.p.rapidapi.com/series/v1/${type}`, {
      headers: {
        'x-rapidapi-key': key,
        'x-rapidapi-host': 'cricbuzz-cricket.p.rapidapi.com',
      },
    });
    return response.data.seriesMapProto;
  } catch (error) {
    console.error(`Error fetching series for type ${type}:`, error);
    return [];
  }
}

// Function to update series in the database
module.exports.updateSeries = async function () {
  try {
    const types = ['international', 'league', 'domestic', 'women'];

    // Loop through each series type
    for (const type of types) {
      const seriesData = await fetchSeriesByType(type);
      //console.log(seriesData, 'seriesData');
      // Loop through each date group in the fetched series data
      for (const seriesObj of seriesData) {
        const seriesArray = seriesObj.series;

        // Loop through each series and store in MongoDB
        for (const series of seriesArray) {
          console.log(series, 'series');
          const { id, name, startDt, endDt } = series;

          // Convert Unix timestamps to Date objects
          const startDate = new Date(Number(startDt));
          const endDate = new Date(Number(endDt));

          // Prepare the data to be saved
          const seriesToSave = {
            seriesId: id,
            name: name,
            date: `${startDate.toLocaleString('default', { month: 'long' })} ${startDate.getFullYear()}`,
            startDate: startDate,
            endDate: endDate,
            type: type, // Store the series type (international, league, domestic, women)
          };

          // Check if the series already exists in the database
          const existingSeries = await Series.findOne({ seriesId: id });
          if (!existingSeries) {
            // Save the new series if it doesn't exist
            await Series.create(seriesToSave);
            console.log(`Series "${name}" with ID ${id} and type ${type} added to the database.`);
          } else {
            // Optionally, you can update the existing series
            console.log(`Series "${name}" with ID ${id} and type ${type} already exists.`);
          }
        }
      }
    }

    console.log("Series data update completed.");
  } catch (error) {
    console.error("Error updating series data:", error);
  }
};
