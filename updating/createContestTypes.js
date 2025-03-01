const ContestType = require("../models/contestType");

module.exports.createDefaultContestTypes = async function createDefaultContestTypes() {
    const defaultContestTypes = [
      {
        name: "Contest Type 1",
        description: "Description for Contest Type 1",
        prize: 1000,
        totalSpots: 100,
        numWinners: 10,
        entryFee: 10,
        prizes: [
          { rank: 1, amount: 500 },
          { rank: 2, amount: 300 },
          { rank: 3, amount: 200 },
        ],
      },
      {
        name: "Contest Type 2",
        description: "Description for Contest Type 2",
        prize: 2000,
        totalSpots: 200,
        numWinners: 20,
        entryFee: 20,
        prizes: [
            { rank: 1, amount: 1000 },
            { rank: 2, amount: 600 },
            { rank: 3, amount: 400 },
          ],
        },
        {
          name: "Contest Type 3",
          description: "Description for Contest Type 3",
          prize: 3000,
          totalSpots: 300,
          numWinners: 30,
          entryFee: 30,
          prizes: [
            { rank: 1, amount: 1500 },
            { rank: 2, amount: 900 },
            { rank: 3, amount: 600 },
          ],
        },
        {
          name: "Contest Type 4",
          description: "Description for Contest Type 4",
          prize: 4000,
          totalSpots: 400,
          numWinners: 40,
          entryFee: 40,
          prizes: [
            { rank: 1, amount: 2000 },
            { rank: 2, amount: 1200 },
            { rank: 3, amount: 800 },
          ],
        },
      ];
      for (const contestType of defaultContestTypes) {
        const existingContestType = await ContestType.findOne({ name: contestType.name });
        if (!existingContestType) {
          await ContestType.create(contestType);
          console.log(`Created default contest type: ${contestType.name}`);
        }
      }
    }