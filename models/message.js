var Message = function(text, datetime, userSend, userReceive){
	this.text = text;
	this.datetime = datetime;
	this.userSend = userSend;
	this.userReceive = userReceive;
};

exports = module.exports = Message;