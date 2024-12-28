var url = window.location.href;

var socket = null;
var stateMenu = 0; // 0 = Not show, 1 = Show, -1 = In animation

var username = null;
var usernameChat = null;
var roomChat = null;
var disconnectUsers = {};


$(document).ready(main);


/**
 * Main function that executes when page load
 */
function main() {

    //MENU BUTTON
    $('#chatRoomsButton').click(toogleMenu);

    // EVENT BUTTON CONNECT
    $('#btConnect').click(startSocket);

    // EVENT KEYDOWN TEXTBOX LOGIN
    $('#loginTextBox').keydown(onTextboxLoginKeydown);

    // SHOW LOGIN POPUP
    $('#popConnect').modal({ backdrop: 'static', keyboard: false });

    // FOCUS ON TEXTBOX
    $('#popConnect').on('shown.bs.modal', function() {
        $('#loginTextBox').focus()
    })

    // SEND MESSAGE
    $('#chatSendButton').click(sendMessage);
    $('#chatTextBox').keydown(onTextboxChatKeydown);

};


/**
 *  Shows and hides the panel with the chat rooms
 */
function toogleMenu() {
    if (stateMenu == 1) {
        hideMenuToLeft();
    } else if (stateMenu == 0) {
        showMenuFromLeft()
    }
}


/**
 *  Shows the panel with the chat rooms
 */
function showMenuFromLeft() {

    stateMenu = -1;

    $('#chatRoomsButtonIcon').removeClass('chatRoomsButtonIconAnimate');

    $('#chat').removeClass('col-xs-12 col-sm-12 col-md-8 col-lg-9');
    $('#chat').addClass('widthAll');

    $('#chatRooms').removeClass('heightAll hidden-xs hidden-sm col-md-4 col-lg-3');
    $('#chatRooms').addClass('chatRoomsShow');

    $('#chatRooms').animate({
        left: '0px'
    }, 700, function() {
        stateMenu = 1;
    });

}


/**
 *  Hides the panel with the chat rooms
 */
function hideMenuToLeft() {

    stateMenu = -1;

    $('#chatRooms').animate({
        left: '-75%'
    }, 700, function() {
        $('#chatRooms').css("left", "");
        $('#chatRooms').removeClass('chatRoomsShow');
        $('#chatRooms').addClass('heightAll hidden-xs hidden-sm col-md-4 col-lg-3');

        $('#chat').removeClass('widthAll');
        $('#chat').addClass('col-xs-12 col-sm-12 col-md-8 col-lg-9');

        stateMenu = 0;

    });

}



/**
 *  Event keydown of login's textbox
 */
function onTextboxLoginKeydown(event) {
    if (event.which == 13) {
        startSocket();
    }
}


/**
 * Event keydown of chat's textbox
 */
function onTextboxChatKeydown(event) {
    if (event.which == 13) {
        sendMessage();
    }
}


/**
 * Emptys the rooms of the list and load it again all rooms
 *
 * @param {Array of String} rooms
 */
function loadRooms(rooms) {

    $('#listRoom').empty();

    for (var i = 0; i < rooms.length; i++) {

        var icon = $('<span>').attr('class', 'fa fa-users listItemUserIconConnect');
        var text = $('<span>').append(rooms[i]);

        var li = $('<li>').attr('id', 'room_' + rooms[i]).attr('class', 'listItemRoom');
        li.append(icon);
        li.append(text);

        li.on("click", loadChatRoom);

        $('#listRoom').append(li);
    }

}


/**
 * Empty the users of the list and load it again all users
 *
 * @param {Array of String} users
 */
function loadUsers(users) {

    $('#listUsers').empty();

    for (var i = 0; i < users.length; i++) {
        if (username != users[i]) {
            var li = createUserItemList(users[i]);
            $('#listUsers').append(li);
        }
    }

}


/**
 *  Adds a new user to the list of users ordered alphabetically
 */
function addUser(user) {

    var li = createUserItemList(user);

    // Gets the users
    var users = $('#listUsers li');

    // If other users -> insert the user ordered alphabetically , beginning with the end
    if (users.length > 0) {

        var userAux;
        var i = users.length - 1;
        var userInsert = false;

        while (i >= 0 && !userInsert) {

            userAux = users[i].id.replace('user_', '');

            if (user > userAux) {
                userInsert = true;
                $('#' + users[i].id).after(li)
            }

            i--;

        }

        if (i < 0 && !userInsert) {
            $('#listUsers').prepend(li);
        }

    } else {
        $('#listUsers').append(li);
    }

}


/**
 *  Creates the items of the list of users
 *
 *  @param {String} user: String with the username
 *  @return {Object} Object with element of type <li> for the list <ul> of users.
 */
function createUserItemList(user) {

    var icon = $('<span>').attr('id', 'userIcon_' + user).attr('class', 'fa fa-user listItemUserIconConnect');
    var text = $('<span>').append(user);
    var bagde = $('<span>').attr('id', 'userBadge_' + user).attr('class', 'badge listItemUserBagde hidden').append(0);

    var li = $('<li>').attr('id', 'user_' + user).attr('class', 'listItemRoom');
    li.append(icon);
    li.append(text);
    li.append(bagde);

    li.on("click", loadChatUser);

    return li;
}


/**
 *  Loads all the messages of one conversations in the chat
 *
 *  @param {Array of Message} messages 
 */
function loadChatMessages(messages, printUserReceive) {

    var datePrevMsg = null;
    var dateMsg = null;

    $('#listChat').empty();

    for (var i = 0; i < messages.length; i++) {

        dateMsg = new Date(messages[i].datetime);

        if (i == 0) {
            addMessageDate(dateMsg);
        } else if ((datePrevMsg.getFullYear() < dateMsg.getFullYear()) || (datePrevMsg.getMonth() < dateMsg.getMonth()) || (datePrevMsg.getDay() < dateMsg.getDay())) {
            addMessageDate(dateMsg);
        }

        addMessage(messages[i], printUserReceive);

        datePrevMsg = dateMsg;

    }

}


/**
 *  Loads all the messages of one conversations in the chat for a user.
 *
 *  @param {Array of Message} messages 
 */
function loadChatMessagesForUser(messages) {

    loadChatMessages(messages, false);

    // Sets the username in title chat
    $('#usernameChat').text(usernameChat);

    // Allows send messages if user is connected
    if (disconnectUsers[usernameChat] == null) {
        $('#usernameChat').css({ "text-decoration": "initial" });
        $('#chatTextBox').removeAttr("disabled");
        $('#chatSendButton').removeClass("disabled");
    } else {
        $('#usernameChat').css({ "text-decoration": "line-through" });
        $('#chatTextBox').attr("disabled", "");
        $('#chatSendButton').addClass("disabled");
    }

    // Hides menu if it is visible
    if (stateMenu == 1) {
        hideMenuToLeft();
    }

    // Hides badge if it is visible
    $('#userBadge_' + usernameChat).text('0');
    $('#userBadge_' + usernameChat).addClass('hidden');

    roomChat = null;

}


/**
 *  Loads all the messages of one conversations in the chat for a room.
 *
 *  @param {Array of Message} messages 
 */
function loadChatMessagesForRoom(messages) {

    loadChatMessages(messages, true);

    // Sets the username in title chat
    $('#usernameChat').text('Room: ' + roomChat);

    $('#usernameChat').css({ "text-decoration": "initial" });
    $('#chatTextBox').removeAttr("disabled");
    $('#chatSendButton').removeClass("disabled");

    // Hides menu if it is visible
    if (stateMenu == 1) {
        hideMenuToLeft();
    }

    usernameChat = null;

}


/**
 *  Adds one message in the chat
 *
 *  @param {Message} msg 
 */
function addMessage(msg, printUserReceive) {

    if (printUserReceive == null) {
        printUserReceive = false;
    }

    var li = null;
    var div = null;
    var table = $('<table>');
    var tr = $('<tr>');
    var tdText = null;
    var tdHour = null;

    if (msg.userSend == username) { // the user send this messaje
        li = $('<li>').attr('class', 'listItemMsg listItemMsgSend');
        div = $('<div>').attr('class', 'msg msgSend');
        tdText = $('<td>').attr('class', 'tdMsgSendText').append(msg.text);
        tdHour = $('<td>').attr('class', 'tdMsgSendHour').append(formatTime(new Date(msg.datetime)));
    } else { // the user receive this message
        li = $('<li>').attr('class', 'listItemMsg listItemMsgReceive');
        div = $('<div>').attr('class', 'msg msgReceive');
        tdText = $('<td>').attr('class', 'tdMsgReceiveText').append(msg.text);
        tdHour = $('<td>').attr('class', 'tdMsgReceiveHour').append(formatTime(new Date(msg.datetime)));

        if (printUserReceive) {
            var trUser = $('<tr>');
            var tdUser = $('<td>').attr('colspan', '2').attr('class', 'tdMsgReceiveUser').append(msg.userSend);
            trUser.append(tdUser);
            table.append(trUser);
        }

    }

    tr.append(tdText);
    tr.append(tdHour);
    table.append(tr);
    div.append(table);
    li.append(div);
    $('#listChat').append(li);

    $('#listChat').scrollTop($('#listChat')[0].scrollHeight);

}


/**
 *  Adds one message in the chat with the date that it receives
 *
 *  @param {Date} date 
 */
function addMessageDate(date) {

    var li = $('<li>').attr('class', 'listItemMsg listItemMsgDate');
    var div = $('<div>').attr('class', 'msg msgDate').append(date.toDateString());

    li.append(div);
    $('#listChat').append(li);

    $('#listChat').scrollTop($('#listChat')[0].scrollHeight);

}


/**
 *  Receives one date and returns the time in format 'HH:mm'
 *
 *  @param {Date} date 
 *  @return {String} String time in format 'HH:mm'
 */
function formatTime(date) {

    var time = '';

    if (date.getHours() < 10) {
        time = '0' + date.getHours();
    } else {
        time = date.getHours();
    }

    time = time + ':'

    if (date.getMinutes() < 10) {
        time = time + '0' + date.getMinutes();
    } else {
        time = time + date.getMinutes();
    }

    return time;

}



/* ================================================= *
 *                   SOCKET-IO                       *
 * ================================================= */


/**
 *  Creates the socket: connects the socket and adds the events
 */
function startSocket() {

    username = $('#loginTextBox').val();
    if (username == '' || username == null) return;

    socket = new io.connect(url);

    socket.on('connect', connectUser);
    socket.on('joinUserDone', onJoinUserDone);
    socket.on('joinUserError', onJoinUserError);
    socket.on('userConnected', onUserConnected);
    socket.on('userDisconnected', onUserDisconnected);
    socket.on('messageUser', onMessageUser);
    socket.on('messageRoom', onMessageRoom);

}


/**
 *  Function executes when the socket connects. 
 *  Sends the event 'joinUser' by the socket.
 */
function connectUser() {
    if (socket != null && socket.connected) {
        socket.emit('joinUser', { username: username });
    }
}


/**
 *  Function executes when the socket receives the event 'joinUserDone'. 
 *  Loads all the users and the rooms in the chat.
 *
 *  @param {Object} data: Object with the properties: 'rooms' (array of String) and 'users' (array of String).
 */
function onJoinUserDone(data) {

    if (data.rooms != null) {
        loadRooms(data.rooms);
    }

    if (data.users != null) {
        loadUsers(data.users);
    }

    $('#username').text(username);
    $('#popConnect').modal('toggle');
    $('#loginTextBox').val(null);
}


/**
 *  Function executes when the socket receives the event 'joinUserError'. 
 *  It is executed when the user is repeated at join, shows an error to the user.
 */
function onJoinUserError() {

    /*

    ADDS THIS DIV TO THE POPUP

    <div id="joinError" class="alert alert-danger hidden" style="margin-top: 5px;">
        <a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>
        <strong>The username is being used.</strong><br>
        <strong>Try again.</strong>
    </div>

    */

    if ($('#joinError').length == 0) {

        var div = $('<div>').attr('id', 'joinError').attr('class', 'alert alert-danger').css({ "margin-top": "5px" });
        var a = $('<a>').attr('class', 'close').attr('data-dismiss', 'alert').attr('aria-label', 'close').attr('href', '#').append('&times;');
        var text1 = $('<strong>').append('The username is being used.');
        var text2 = $('<strong>').append('Try again.');

        div.append(a);
        div.append(text1);
        div.append('<br>');
        div.append(text2);

        $('#popConnectContent').append(div);
    }

}


/**
 * Function executes when the socket receives the event 'userConnected'. 
 * Adds the user to the list of users.
 *
 * @param {Object} data: Object with the property: 'userOn' (String with username of user connected). 
 */
function onUserConnected(data) {

    // User reconnect after disconnect
    if (disconnectUsers[data.userOn] != null) {

        delete disconnectUsers[data.userOn];

        $('#userIcon_' + data.userOn).removeClass('listItemUserIconDisconnect');
        $('#userIcon_' + data.userOn).addClass('listItemUserIconConnect');

        if (data.userOn == usernameChat) {
            $('#usernameChat').css({ "text-decoration": "initial" });
            $('#chatTextBox').removeAttr("disabled");
            $('#chatSendButton').removeClass("disabled");
        }

    } else {
        addUser(data.userOn);
    }

}


/**
 * Function executes when the socket receives the event 'userDisconnected'. 
 * Sets the user as offline in chat.
 *
 * @param {Object} data: Object with the property: 'userOff' (String with username of user disconnected). 
 */
function onUserDisconnected(data) {

    disconnectUsers[data.userOff] = "";

    // Puts icon disconnect
    $('#userIcon_' + data.userOff).removeClass('listItemUserIconConnect');
    $('#userIcon_' + data.userOff).addClass('listItemUserIconDisconnect');

    if (data.userOff == usernameChat) {
        $('#usernameChat').css({ "text-decoration": "line-through" });
        $('#chatTextBox').attr("disabled", "");
        $('#chatSendButton').addClass("disabled");
    }

}


/**
 *  Function executes when user clicks on the name of other user to talk with him.
 *  Emits the event 'loadChatUser' by the socket to load the chat with the other user.
 */
function loadChatUser() {
    if (socket != null && socket.connected) {
        roomChat = null;
        usernameChat = this.id.replace("user_", "");
        socket.emit('loadChatUser', usernameChat, loadChatMessagesForUser);
    }
}


/**
 *  Function executes when user clicks on the name of a room to talk.
 *  Emits the event 'joinToRoom' by the socket to load the chat of the room.
 */
function loadChatRoom() {
    if (socket != null && socket.connected) {
        usernameChat = null;
        roomChat = this.id.replace("room_", "");
        socket.emit('joinToRoom', roomChat, loadChatMessagesForRoom);
    }
}


/**
 *  Function executes when user clicks on the button "sendMessage" or press key enter in the text box "chatTextBox".
 *  Emits the event 'sendMessageUser' or 'sendMessageRoom' by the socket to send the message.
 */
function sendMessage() {
    if (socket != null && socket.connected && $('#chatTextBox').val() != "") {

        var msg = {};
        msg.text = $('#chatTextBox').val();

        if (usernameChat != null) {
            msg.username = usernameChat;
            socket.emit('sendMessageUser', msg);
        } else if (roomChat != null) {
            msg.room = roomChat;
            socket.emit('sendMessageRoom', msg);
        }

        $('#chatTextBox').val(null);
    }
}


/**
 * Function executes when the socket receives the event 'messageUser'. 
 * If message that receives is from the user in chat or from me -> Load the message in chat.
 * Else -> Show bagdet in the list of user.
 */
function onMessageUser(msg) {

    if (usernameChat != null && (msg.userSend == usernameChat || msg.userSend == username)) {
        addMessage(msg, false);
    } else {

        var numMsg = parseInt($('#userBadge_' + msg.userSend).text());
        numMsg++;
        $('#userBadge_' + msg.userSend).text(numMsg);
        $('#userBadge_' + msg.userSend).removeClass('hidden');

        // If button menu is visible -> mobile: Add to icon an animation to indicate the new message
        if (stateMenu == 0) {
            $('#chatRoomsButtonIcon').addClass('chatRoomsButtonIconAnimate');
        }

    }

    // Puts the user first in the list
    var li = $('#user_' + msg.userSend);
    $('#listUsers #user_' + msg.userSend).remove();
    li.on("click", loadChatUser);
    $('#listUsers').prepend(li);

}


/**
 * Function executes when the socket receives the event 'messageRoom'. 
 * Load the message in chat.
 */
function onMessageRoom(msg) {

    if (roomChat != null) {
        addMessage(msg, true);
    }

}
