import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:5000');

function App() {
  const [username, setUsername] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState('');

  useEffect(() => {
    

    socket.on('initialData', ({ users, messages }) => {
      console.log("Received initial data:", users, messages);
      setUsers(users);
      setMessages(messages);
    });

    socket.on('userList', (users) => {
      console.log("Updated user list:", users);
      setUsers(users);
    });

    socket.on('userConnected', (username) => {
      console.log(`${username} connected`);
      setUsers((prev) => [...prev, { username }]);
    });

    socket.on('userDisconnected', (username) => {
      console.log(`${username} disconnected`);
      setUsers((prev) => prev.filter((user) => user.username !== username));
    });

    socket.on('message', (message) => {
      console.log("New message:", message);
      setMessages((prev) => [...prev, message]);
    });

    socket.on('typing', (username) => {
      console.log(`${username} is typing...`);
      setTyping(username);
      setTimeout(() => setTyping(''), 10000);
    });

    return () => {
      console.log("Cleaning up socket listeners");
      socket.off('initialData');
      socket.off('userList');
      socket.off('userConnected');
      socket.off('userDisconnected');
      socket.off('message');
      socket.off('typing');
    };
  }, []);

  const handleLogin = () => {
    socket.emit('login', username);
    setLoggedIn(true);
    console.log(`${username} logged in`);
  };

  const handleMessageSend = () => {
    if (message.trim()) {
      const newMessage = { username, text: message };
      socket.emit('sendMessage', newMessage);
      console.log("Message sent:", newMessage);
      setMessage('');
    }
  };

  const handleTyping = () => {

    socket.emit('typing', username);
    console.log(typing)
    console.log(username)
    console.log(`${username} typing event emitted`);
  };

  return (
    <div className="App">
      {!loggedIn ? (
        <div className="login-container">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
          />
          <button onClick={handleLogin}>Login</button>
        </div>
      ) : (
        <div className="chat-container">
          <div className="user-list-container">
            <h3>Users</h3>
            {users.map((user) => (
              <div key={user._id} className="user">
                <div className="avatar">{user.username.charAt(0).toUpperCase()}</div>
                <div className="name">{user.username}</div>
              </div>
            ))}
          </div>
          <div className="chat-box-container">
            <div className="messages">
              {messages.map((msg, index) => (
                <div
                  key={msg._id}
                  className={`message ${msg.username === username ? 'own' : 'other'}`}
                >
                  <span style={{ color: "blue" }}>{msg.username}</span>: {msg.text}
                </div>
              ))}
            </div>
              {typing !== '' ? <h1 className="typing">{typing} is typing...</h1> :''}
            <div className="input-container">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleTyping}
                placeholder="Type a message"
              />
              <button onClick={handleMessageSend}>Send</button>
            </div>
          </div>
          <div className="active-user">
            <div className="avatar">{username.charAt(0).toUpperCase()}</div>
            <div className="name">{username}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
