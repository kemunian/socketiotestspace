var socketio = require('socket.io')({
    'log level': 1
});

var log4js = require('log4js');
var log = log4js.getLogger("SocketError");

var User = require('../models/user.js');
var Room = require('../models/room.js');
var Message = require('../models/message.js');

var io = null;
var users = {}; // Stores connected users, each user is identified by his username in the property.
var rooms = {}; // Stores rooms, each room is identified by the room name in the property.


/**
 *  Creates the chat with the rooms and asociates the events to the callback functions. 
 */
exports.createChat = function(server) {

    rooms['Room1'] = new Room('Room1');
    rooms['Room2'] = new Room('Room2');
    rooms['Room3'] = new Room('Room3');

    io = socketio.listen(server);

    io.sockets.on('connection', function(socket) {
        socket.on('joinUser', joinUser);
        socket.on('disconnect', disconnectSocket);
        socket.on('loadChatUser', loadChatUser);
        socket.on('sendMessageUser', sendMessageUser);
        socket.on('joinToRoom', joinToRoom);
        socket.on('sendMessageRoom', sendMessageRoom);
    });

    return server;

}


/**
 *  Function executes when the socket receives the event 'joinUser'. 
 *  Identifies the new user in the chat.
 *
 *  @param {Object} user: Object with the username of the new user.
 */
function joinUser(user) {
    try {

        if (user.username != '' && users[user.username] == null && rooms[user.username] == null) {

            // Creates new user in the chat
            users[user.username] = new User(user.username, this.id);

            // Generates object to return with the users and rooms
            var data = {};
            data['users'] = Object.keys(users).sort();
            data['rooms'] = Object.keys(rooms).sort();
            data['userOn'] = user.username;

            // Sets username in the properties of socket
            this['username'] = user.username;

            // Emits event 'joinUserDone' to the new user
            this.emit('joinUserDone', data);

            // Emits event 'userConnected' to the rest of users
            delete data['users'];
            delete data['rooms'];
            this.broadcast.emit('userConnected', data);

        } else {
            this.emit('joinUserError');
        }

    } catch (err) {
        log.error(err);
    }
}


/**
 *  Function executes when the socket receives the event 'disconnect'. 
 *  Delete all data of the user of the socket. Emits the event 'userDisconnected' to all the users.
 */
function disconnectSocket() {
    try {

        if (users[this['username']] != null) {

            delete users[this['username']];

            var data = {};
            data['userOff'] = this['username'];

            io.emit('userDisconnected', data);

        }

    } catch (err) {
        log.error(err);
    }
}


/**
 *  Function executes when the socket receives the event 'loadChatUser'. 
 *  For chats between users. Sends to the user all messages of the chat. Creates the chat if is the first time in talk.
 */
function loadChatUser(username, loadChatMessagesForUser) {
    try {

        if (users[this.username].joinRoom != null) {
            this.leave(users[this.username].joinRoom);
            users[this.username].joinRoom = null;
        }

        // If both users are connected
        if ((users[this.username] != null) && (users[username] != null)) {

            // If had not spoken before -> Create the chat
            if ((users[this.username].chats[username] == null) && (users[username].chats[this.username] == null)) {
                var chatMessages = Array();
                users[this.username].chats[username] = chatMessages;
                users[username].chats[this.username] = chatMessages;


            // They talked before, but a user is disconnected and reconnected
            } else if ((users[this.username].chats[username] != null) && (users[username].chats[this.username] == null)) {
                users[username].chats[this.username] = users[this.username].chats[username];


            // They talked before, but a user is disconnected and reconnected
            } else if ((users[this.username].chats[username] == null) && (users[username].chats[this.username] != null)) {
                users[this.username].chats[username] = users[username].chats[this.username];
            }


        } else if (users[this.username].chats[username] == null) {
            users[this.username].chats[username] = Array();
        }

        // Sends to the user all messages of the chat.
        loadChatMessagesForUser(users[this.username].chats[username]);

    } catch (err) {
        log.error(err);
    }
}


/**
 *  Function executes when the socket receives the event 'sendMessageUser'.
 *  For chats between users. Receives the message to send and reemits for both sockects the message.
 */
function sendMessageUser(msgData) {
    try {

        if ((users[this.username] != null) && (users[msgData.username] != null)) {
            var msg = new Message(msgData.text, new Date(), this.username, msgData.username);
            users[this.username].chats[msgData.username].push(msg);

            this.broadcast.to(users[msgData.username].socketId).emit('messageUser', msg);
            this.emit('messageUser', msg);
        }
    } catch (err) {
        log.error(err);
    }
}


/**
 *  Function executes when the socket receives the event 'joinToRoom'.
 *  For chat of room. Joins a user to the room and returns the messages of the room.
 */
function joinToRoom(room, loadChatMessagesForRoom) {
    try {

        if (users[this.username].joinRoom != null) {
            this.leave(users[this.username].joinRoom);
            users[this.username].joinRoom = null;
        }

        this.join(room);
        users[this.username].joinRoom = room;

        // Sends to the user all messages of the room.
        loadChatMessagesForRoom(rooms[room].chats);

    } catch (err) {
        log.error(err);
    }
}


/**
 *  Function executes when the socket receives the event 'sendMessageRoom'.
 *  For chat of room. Receives the message to send and reemits for the socket of the room.
 */
function sendMessageRoom(msgData) {
    try {

        if ((users[this.username] != null) && (rooms[msgData.room] != null)) {

            // Only save 50 messages
            if (rooms[msgData.room].chats.length >= 50) {
                rooms[msgData.room].chats = rooms[msgData.room].chats.slice(1, rooms[msgData.room].chats.length);
            }

            var msg = new Message(msgData.text, new Date(), this.username, msgData.room);
            rooms[msgData.room].chats.push(msg);
            io.to(msgData.room).emit('messageRoom', msg);
        }

    } catch (err) {
        log.error(err);
    }
}
