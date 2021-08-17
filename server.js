const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const router = require('./router');
const cors = require('cors');
const PORT = process.env.PORT || 5000;
const URL = process.env.URL || 'https://optimistic-kepler-270d49.netlify.app';
const { addUser, getUser, getUsersInRoom, removeUser } = require('./user');

const app = express();
app.use(cors());
app.use(router);
const server = http.createServer(app);

// app.use(cors());
const io = socketio(server, {
  cors: {
    origin: URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// io
io.on('connection', (socket) => {
  console.log('we have a new Connection');

  // emit
  socket.on('join', ({ name, room }, callback) => {
    console.log(name, 'join', room);
    const { error, user } = addUser({ id: socket.id, name, room });
    if (error) return callback(error);

    socket.join(user.room);

    socket.emit('message', {
      user: 'admin',
      text: `${user.name}, welcome to room ${user.room}.`,
    });

    socket.broadcast
      .to(user.room)
      .emit('message', { user: 'admin', text: `${user.name} has joined!` });

    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    callback();
  });

  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id);
    io.to(user.room).emit('message', { user: user.name, text: message });
    callback();
  });

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);
    console.log('User has left');
    if (user) {
      io.to(user.room).emit('message', {
        user: 'Admin',
        text: `${user.name} has left.`,
      });
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});

server.listen(PORT, () => console.log(`server is running on ${PORT}`));
