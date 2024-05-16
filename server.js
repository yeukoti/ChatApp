const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
  }
});

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/chat', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const userSchema = new mongoose.Schema({
  username: String
}, { versionKey: false });

const messageSchema = new mongoose.Schema({
  username: String,
  text: String,
  timestamp: { type: Date, default: Date.now }
}, { versionKey: false });




const User = mongoose.model('User', userSchema);
const Message = mongoose.model('Message', messageSchema);

io.on('connection', (socket) => {
  let currentUser = null;

  socket.on('login', async (username) => {
    currentUser = new User({ username });
    await currentUser.save();

    const users = await User.find();
    const messages = await Message.find().sort({ timestamp: 1 });

    socket.emit('initialData', { users, messages });
    socket.broadcast.emit('userConnected', username);

    socket.on('disconnect', async () => {
      if (currentUser) {
        await User.deleteOne({ username: currentUser.username });

        const updatedUsers = await User.find();
        io.emit('userList', updatedUsers);

        socket.broadcast.emit('userDisconnected', currentUser.username);
      }
    });
  });

  socket.on('sendMessage', async (message) => {
    const newMessage = new Message(message);
    await newMessage.save();
    //io.emit('message', message);
    io.emit('message',{...message,_id:newMessage._id})
  });

  socket.on('typing', (username) => {
    socket.broadcast.emit('typing', username);
    console.log(username)
  });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
