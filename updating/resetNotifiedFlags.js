const NotifyPlayer = require("../models/notifyPlayer"); // Adjust path as needed

module.exports.resetPlayerNotifiedFlags = async function addcommentry(format)  {
  try {
    await NotifyPlayer.updateMany({}, {
      $set: {
        "players.$[].battingNotified": false,
        "players.$[].bowlingNotified": false
      }
    });
    console.log("✅ Notification flags reset for all users.");
  } catch (error) {
    console.error("❌ Error resetting notification flags:", error.message);
  }
}
