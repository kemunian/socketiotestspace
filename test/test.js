var assert = require('assert'),
	io = require('socket.io-client'),
	http = require('http');

var socketURL = 'http://localhost:5555';

var chatUser1 = 'Diego';
var chatUser2 = 'Ana';
var chatRoom = 'Room1';


describe('> Server returns all the requests', function() {

	describe('1. Server returns the route /', function() {
		it('Should return the code 200', function(done) {
			http.get(socketURL, function(res) {
				assert.equal(200, res.statusCode);
				done();
			});
		});
	});

	describe('2. Server returns the file of css', function() {
		it('Should return the code 200', function(done) {
			http.get(socketURL + '/css/chat.css', function(res) {
				assert.equal(200, res.statusCode);
				done();
			});
		});
	});

	describe('3. Server returns the file of css of bootstrap', function() {
		it('Should return the code 200', function(done) {
			http.get(socketURL + '/css/bootstrap.min.css', function(res) {
				assert.equal(200, res.statusCode);
				done();
			});
		});
	});

	describe('4. Server returns the file of css of font-awesome', function() {
		it('Should return the code 200', function(done) {
			http.get(socketURL + '/css/font-awesome.min.css', function(res) {
				assert.equal(200, res.statusCode);
				done();
			});
		});
	});

	describe('5. Server returns the file of javascript of the chat', function() {
		it('Should return the code 200', function(done) {
			http.get(socketURL + '/js/chat.js', function(res) {
				assert.equal(200, res.statusCode);
				done();
			});
		});
	});

	describe('6. Server returns the file of javascript of jquery', function() {
		it('Should return the code 200', function(done) {
			http.get(socketURL + '/js/jquery-2.2.0.min.js', function(res) {
				assert.equal(200, res.statusCode);
				done();
			});
		});
	});

	describe('7. Server returns file of javascript of bootstrap', function() {
		it('Should return the code 200', function(done) {
			http.get(socketURL + '/js/bootstrap.min.js', function(res) {
				assert.equal(200, res.statusCode);
				done();
			});
		});
	});

	describe('8. Server returns file of javascript of socket.io client', function() {
		it('Should return the code 200', function(done) {
			http.get(socketURL + '/socket.io/socket.io.js', function(res) {
				assert.equal(200, res.statusCode);
				done();
			});
		});
	});

	describe('9. Server returns favicon', function() {
		it('Should return the code 200', function(done) {
			http.get(socketURL + '/favicon.ico', function(res) {
				assert.equal(200, res.statusCode);
				done();
			});
		});
	});

});


describe('> Join users to chat', function() {

	describe('1. Connect new user with username non-existent in chat ', function() {
		it('Should connect the new user', function(done) {

			var socketUser = new io.connect(socketURL);

			// Connects the user
			socketUser.on('connect', function(data) {
				socketUser.emit('joinUser', {
					username: chatUser1
				});
			});

			// Receives event 'joinUserDone' from server indicating that user is connected
			socketUser.on('joinUserDone', function(data) {

				if (data.users.indexOf(chatUser1) > -1) {
					socketUser.disconnect();
					done();
				}

			});

		});
	});

	describe('2. Connect new user with username existent in chat ', function() {
		it('Should not connect the new user', function(done) {

			var socketUser1 = new io.connect(socketURL);
			var socketUser2 = null;

			// Connects first user
			socketUser1.on('connect', function(data) {
				socketUser1.emit('joinUser', {
					username: chatUser1
				});
			});

			// Receives event 'joinUserDone' from server indicating that first user is connected
			socketUser1.on('joinUserDone', function(data) {

				socketUser2 = new io.connect(socketURL);

				// Connects second user
				socketUser2.on('connect', function(data) {
					socketUser2.emit('joinUser', {
						username: chatUser1
					});
				});

				// Receives event 'joinUserError' from server indicating that second user is not connected
				socketUser2.on('joinUserError', function(data) {
					socketUser1.disconnect();
					socketUser2.disconnect();
					done();
				});

			});

		});
	});

	describe('3. Connect two users in chat ', function() {

		it('Should broadcast new user to all users', function(done) {

			var socketUser1 = new io.connect(socketURL);
			var socketUser2 = null;

			// Connects first user
			socketUser1.on('connect', function(data) {
				socketUser1.emit('joinUser', {
					username: chatUser1
				});
			});

			// Receives event 'joinUserDone' from server indicating that first user is connected
			socketUser1.on('joinUserDone', function(data) {

				socketUser2 = new io.connect(socketURL);

				// Connects second user
				socketUser2.on('connect', function(data) {
					socketUser2.emit('joinUser', {
						username: chatUser2
					});
				});

			});

			// Receives event 'userConnected' from server indicating that a user is connected
			socketUser1.on('userConnected', function(data) {
				if (data.userOn == chatUser2) {
					socketUser1.disconnect();
					socketUser2.disconnect();
					done();
				}
			});

		});


		it('Should broadcast disconnected user to all users', function(done) {

			var socketUser1 = new io.connect(socketURL);
			var socketUser2 = null;

			// Connects first user
			socketUser1.on('connect', function(data) {
				socketUser1.emit('joinUser', {
					username: chatUser1
				});
			});

			// Receives event 'joinUserDone' from server indicating that first user is connected
			socketUser1.on('joinUserDone', function(data) {

				socketUser2 = new io.connect(socketURL);

				// Connects second user
				socketUser2.on('connect', function(data) {
					socketUser2.emit('joinUser', {
						username: chatUser2
					});
				});

				// Receives event 'joinUserDone' from server indicating that second user is connected
				socketUser2.on('joinUserDone', function(data) {
					socketUser2.disconnect(); // Disconnects the second user
				});

			});

			// Receives event 'userDisconnected' from server indicating that a user is disconnected
			socketUser1.on('userDisconnected', function(data) {
				if (data.userOff == chatUser2) {
					socketUser1.disconnect();
					done();
				}
			});

		});

	});

});


describe('> Messages between users', function() {

	describe('1. Send and receive message between users', function() {

		it('Should broadcast the message to both users', function(done) {

			var socketUser1 = new io.connect(socketURL);
			var socketUser2 = null;

			var numMsg = 0;

			// Connects first user
			socketUser1.on('connect', function(data) {
				socketUser1.emit('joinUser', {
					username: chatUser1
				});
			});

			// Receives event 'joinUserDone' from server indicating that first user is connected
			socketUser1.on('joinUserDone', function(data) {

				socketUser2 = new io.connect(socketURL);

				// Connects second user
				socketUser2.on('connect', function(data) {
					socketUser2.emit('joinUser', {
						username: chatUser2
					});
				});

				// Receives event 'messageUser' from server indicating that a user send a message to the second user
				socketUser2.on('messageUser', function(msg) {

					if (msg.text == "Hello world" && msg.userSend == chatUser1) {
						numMsg++;
					}

					// Validates the test when both user receives the event 'messageUser'
					if (numMsg == 2) {
						socketUser1.disconnect();
						socketUser2.disconnect();
						done();
					}

				});

			});

			// Receives event 'userConnected' from server indicating that the second user is connected
			socketUser1.on('userConnected', function(data) {

				// Load a chat with the second user
				socketUser1.emit('loadChatUser', chatUser2, function(messages) {

					// Sends a message to the second user
					if (data.userOn == chatUser2) {
						var msg = {};
						msg.text = "Hello world";
						msg.username = chatUser2;
						socketUser1.emit('sendMessageUser', msg);
					}

				});

			});

			// Receives event 'messageUser' from server indicating that a user send a message to the first user
			socketUser1.on('messageUser', function(msg) {

				if (msg.text == "Hello world" && msg.userSend == chatUser1) {
					numMsg++;
				}

				// Validates the test when both user receives the event 'messageUser'
				if (numMsg == 2) {
					socketUser1.disconnect();
					socketUser2.disconnect();
					done();
				}

			});

		});

	});

	describe('2. Load messages of chat', function() {

		it('Should load all the messages of the chat', function(done) {

			var socketUser1 = new io.connect(socketURL);
			var socketUser2 = null;

			var numMsg = 0;

			// Connects first user
			socketUser1.on('connect', function(data) {
				socketUser1.emit('joinUser', {
					username: chatUser1
				});
			});

			// Receives event 'joinUserDone' from server indicating that first user is connected
			socketUser1.on('joinUserDone', function(data) {

				socketUser2 = new io.connect(socketURL);

				// Connects second user
				socketUser2.on('connect', function(data) {
					socketUser2.emit('joinUser', {
						username: chatUser2
					});
				});

			});

			// Receives event 'userConnected' from server indicating that the second user is connected
			socketUser1.on('userConnected', function(data) {

				// Load a chat with the second user
				socketUser1.emit('loadChatUser', chatUser2, function(messages) {

					// Sends two messages to the second user
					if (data.userOn == chatUser2) {

						var msg = {};
						msg.text = "First message";
						msg.username = chatUser2;
						socketUser1.emit('sendMessageUser', msg);

						var msg2 = {};
						msg2.text = "Second message";
						msg2.username = chatUser2;
						socketUser1.emit('sendMessageUser', msg2);

					}

				});

			});

			// Receives event 'messageUser' from server indicating that a user send a message to the first user
			socketUser1.on('messageUser', function(msg) {

				numMsg++;

				// Validates the test when first user receives both messages, and after of load the messages again
				if (numMsg == 2) {

					socketUser1.emit('loadChatUser', chatUser2, function(messages) {

						if (messages.length == 2 && messages[0].text == "First message" && messages[1].text == "Second message") {
							socketUser1.disconnect();
							socketUser2.disconnect();
							done();
						}

					});

				}

			});

		});

	});

});


describe('> Chat rooms', function() {

	describe('1. Join to a chat room', function() {

		it('Should receive all messages of the chat room', function(done) {

			var socketUser = new io.connect(socketURL);

			// Connects user
			socketUser.on('connect', function(data) {
				socketUser.emit('joinUser', {
					username: chatUser1
				});
			});

			// Receives event 'joinUserDone' from server indicating that user is connected
			socketUser.on('joinUserDone', function(data) {


				// Join to a chat room
				socketUser.emit('joinToRoom', chatRoom, function(data) {
					socketUser.disconnect();
					done();
				});


			});

		});

	});


	describe('2. Send and receive message in a chat room', function() {

		it('Should broadcast the message to all users', function(done) {

			var numMsg = 0;
			var numUsersRoom = 0;

			var sendMessage = function(socketUser) {

				numUsersRoom++;

				if (numUsersRoom == 2){
					var msg = {};
					msg.text = "Hello world";
					msg.room = chatRoom;
            socketUser.emit('sendMessageRoom', msg);
				}

			}


			var socketUser1 = new io.connect(socketURL);
			var socketUser2 = null;


			// Connects first user
			socketUser1.on('connect', function(data) {
				socketUser1.emit('joinUser', {
					username: chatUser1
				});
			});

			// Receives event 'joinUserDone' from server indicating that first user is connected
			socketUser1.on('joinUserDone', function(data) {

				// Join first user to a chat room
				socketUser1.emit('joinToRoom', chatRoom, function(data) {
					sendMessage(socketUser2);
				});

				socketUser2 = new io.connect(socketURL);

				// Connects second user
				socketUser2.on('connect', function(data) {
					socketUser2.emit('joinUser', {
						username: chatUser2
					});
				});

				// Receives event 'joinUserDone' from server indicating that second user is connected
				socketUser2.on('joinUserDone', function(data) {

					// Join second user to a chat room
					socketUser2.emit('joinToRoom', chatRoom, function(data) {
						sendMessage(socketUser2);
					});

				});

				// Receives event 'messageRoom' from server indicating that a user send a message to the chat room
				socketUser2.on('messageRoom', function(msg) {

					if (msg.text == "Hello world") {
						numMsg++;
					}

					// Validates the test when both user receives the event 'messageUser'
					if (numMsg == 2) {
						socketUser1.disconnect();
						socketUser2.disconnect();
						done();
					}

				});

			});


			// Receives event 'messageRoom' from server indicating that a user send a message to the chat room
			socketUser1.on('messageRoom', function(msg) {

				if (msg.text == "Hello world") {
					numMsg++;
				}

				// Validates the test when both user receives the event 'messageUser'
				if (numMsg == 2) {
					socketUser1.disconnect();
					socketUser2.disconnect();
					done();
				}

			});

		});
	});

});