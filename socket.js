const express = require("express");
const app = express();
const path = require("path");
const cors = require("cors");
const server = require("http").createServer(app);
const User = require("./models/user");
const Matches = require("./models/match_live_details_new");

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});
const port = 4000;

server.listen(port, () => {
  console.log("Server listening at port %d", port);
});

// Routing
app.use(express.static(path.join(__dirname, "public")));
app.use(
  cors({
    origin: [
      "https://addictivemediafrontend.vercel.app",
      "http://127.0.0.1:3000/",
      "http://127.0.0.1:3001",
      "http://localhost:3000",
      "http://localhost:8000",
    ],
  })
);
// Chatroom

let rooms = [];

io.on("connection", (socket) => {
  let addedUser = false;
  // when the client emits 'new message', this listens and executes
  socket.on("new message", (data) => {
    // we tell the client to execute 'new message'
  });
  socket.on("join", (data) => {
    const { matchid } = data;
    console.log(data,matchid,'da') // Data sent from client when join_room event emitted
    socket.join(matchid);
    rooms = [matchid, ...rooms];
  });
  // echo globally (all clients) that a person has connected
  setInterval(async () => {
    for (let i = 0; i < rooms.length; i++) {
      io.to('2679235').emit("newcommentary", {
        commentary: 'my',
      });
      console.log(i,'room',rooms)
      var my = await Matches.find();
      console.log(my,'my')
    }
  }, 8000);
  // when the client emits 'add user', this listens and executes

});

// when
