const express = require("express");
const http = require("http");
const socketio = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "*",
    method: ["GET", "POST"],
  },
});

let activeSockets = [];

io.on("connection", (socket) => {
  socket.emit("me", socket.id);
  activeSockets.push(socket.id);

  socket.emit("serverliveList", activeSockets);

  socket.on("disconnect", () => {
    socket.broadcast.emit("disconnected");
    activeSockets = activeSockets.filter((id) => id !== socket.id);

    // Send the updated active socket list to all connected clients if it has changed
    if (JSON.stringify(activeSockets) !== JSON.stringify(io.activeSockets)) {
      io.activeSockets = activeSockets;
      io.emit("serverliveList", activeSockets);
    }
  });

  socket.on("callUser", ({ from, to, offer }) => {
    // console.log(offer);
    io.to(to).emit("vcIncoming", { from, offer });
  });

  socket.on("vcStart", ({ from, to, answer }) => {
    io.to(to).emit("vcStart", { from, answer });
  });

  socket.on("vcEnd", ({ to }) => {
    io.to(to).emit("vcEnd");
  });

  socket.on("sendMsg", (msg) => {
    // console.log(`sending ${msg.txt} from ${msg.from} to ${msg.to}`);
    io.to(msg.to).emit("recMsg", msg);
  });

  socket.on("invite", (invite) => {
    io.to(invite.to).emit("invite", invite);
  });

  socket.on("invAcc", (inv) => {
    io.to(inv.from).emit("invAcc", inv);
  });
});

server.listen(process.env.PORT || 8000, () => {
  console.log("Server running");
});
