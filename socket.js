const express = require("express");

const app = express();
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");
const server = require("http").createServer(app);
const { setTimeout } = require("timers");
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});
const User = require("./models/user");
const Matches = require("./models/match_live_details_new");

const uri =
  "mongodb+srv://rajeshmn47:uni1ver%40se@cluster0.bpxam.mongodb.net/mydreamDatabaseSecond?retryWrites=true&w=majority";

mongoose.Promise = global.Promise;
mongoose.connect(
  uri,
  { useNewUrlParser: true, useUnifiedTopology: true },
  (error) => {
    if (error) {
      console.log(`Error!${error}`);
    }
  }
);

const port = 4000;

server.listen(port, () => {
  console.log("Server listening at port %d", port);
});

// Routing
app.use(express.static(path.join(__dirname, "public")));
app.use(cors({ origin: "*", credentials: false }));

// Chatroom

let rooms = [];

io.on("connection", (socket) => {
  const addedUser = false;
  // when the client emits 'new message', this listens and executes
  socket.on("new message", (data) => {
    // we tell the client to execute 'new message'
  });
  socket.on("join", (data) => {
    const { matchid } = data;
    socket.join("timer");
    console.log(data, matchid, "da"); // Data sent from client when join_room event emitted
    socket.join(matchid);
    k = rooms.find((r) => r == matchid);
    if (!k) {
      rooms = [matchid, ...rooms];
    }
  });
  socket.on("leave", (data) => {
    console.log(data, "leftroom");
    socket.leave(data.matchid);
  });
  // echo globally (all clients) that a person has connected

  // when the client emits 'add user', this listens and executes
});
let k = 0;

setInterval(async () => {
  for (let i = 0; i < rooms.length; i++) {
    console.log(rooms[i], "room");
    const match = await Matches.findOne({ matchId: rooms[i] });
    const notfound = {
      comment_text: "six hit",
      eventType: "six",
      overNum: "5",
    };
    if (match) {
      io.sockets.in(rooms[i]).emit("newcommentary", {
        commentary:
          match?.commentary[match?.commentary?.length - 1] || notfound,
      });
    } else {
      console.log(err);
    }
  }
}, 10000);
