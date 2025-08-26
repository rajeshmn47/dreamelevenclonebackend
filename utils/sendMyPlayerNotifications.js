const NotifyPlayer = require("../models/notifyPlayer");
const Player = require("../models/players");
const User = require("../models/user");
const { messaging } = require("./firebaseinitialize");


module.exports.sendMyPlayerNotifications = async function (batsman, bowler) {
    console.log(batsman, bowler)
    try {
        // Find users who want notifications for players now batting
        const natifications = await NotifyPlayer.find();
        // console.log(natifications,'notifications')
        const battingNotifs = await NotifyPlayer.find({
            players: {
                $elemMatch: {
                    player_id: { $in: batsman }, // e.g. [1001, 1005]
                    batting: true,
                    battingNotified: false
                }
            }
        });

        // Find users who want notifications for players now bowling
        const bowlingNotifs = await NotifyPlayer.find({
            players: {
                $elemMatch: {
                    player_id: { $in: bowler }, // e.g. [1001, 1005]
                    bowling: true,
                    bowlingNotified: false
                }
            }
        });

        const notifications = [...battingNotifs, ...bowlingNotifs];
      for (const notif of natifications) {
            const user = await User.findById(notif.user_id);
            if (!user) continue;
            for (const p of notif.players) {
                 console.log(p,'p')
                if ((!p.battingNotified || !p.bowlingNotified)&&(p.player_id==batsman||p.player_id==bowler)) {
                    console.log(p.player_id, batsman, bowler, 'batsman')
                    const action = batsman == p.player_id
                        ? 'batting'
                        : bowler == p.player_id
                            ? 'bowling'
                            : 'playing';
                    console.log(p, action, 'p')
                    let player = await Player.findOne({ id: p.player_id })
                    const title = `Player Alert`;
                    const body = `${player?.name} is now ${action}`;
                    const data = { playerId: p.player_id, action };

                    console.log(user.fcmtoken, title, body, data, 'rajesh');
                    const message = {
                        notification: {
                            title: title,
                            body: `${body}`,
                        },
                        token: user?.fcmtoken
                    };
                    await messaging.send(message)
                    p.battingNotified = true;
                    p.bowlingNotified = true;
                }
            }
            await notif.save()
}
    } catch (err) {
        console.error('❌ Error in sendMyPlayerNotifications:', err.message);
    }
};

