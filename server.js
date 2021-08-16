const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const router = require('./router');

const PORT = process.env.PORT || 5000;

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// io
io.on('connection', (socket) => {
  console.log('we have a new Connection');
  socket.on('disconnect', () => {
    console.log('User ha left');
  });
});

app.use(router);

server.listen(PORT, () => console.log(`server is running on ${PORT}`));