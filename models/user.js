var User = function(username, socketId){
	this.username = username;
	this.socketId = socketId;
	this.joinRoom = null;

	/*
	 * Save a reference of an array with objects 'Message', the property name is the username of the other user
	 * There will be two references to the array of objects 'Message'. In both users.
	 * 				user1.chats[username2] = user2.chats[username1]
	 */
	this.chats = {};
};

exports = module.exports = User;