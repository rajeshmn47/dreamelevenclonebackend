const { createDefaultContestTypes } = require("./createContestTypes.js");
const { addMatchesForAllCurrentSeries } = require("./addMatchFromSeries.js");
const { updateSeries } = require("./addSeries.js");
const { updateSquads } = require("./updateSquads.js");
const { addingkeys } = require("./addingkeys.js");

module.exports.runconfigurations = async function addcommentry(format) {
    try {
        await createDefaultContestTypes();
        await addingkeys();
        await updateSeries();
        await updateSquads();
        await addMatchesForAllCurrentSeries();
    } catch (error) {
        console.error("❌ Error resetting notification flags:", error.message);
    }
}
