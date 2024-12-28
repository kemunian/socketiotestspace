var express = require('express'),
	http = require('http'),
	compression = require('compression'),
	favicon = require('serve-favicon'),
	bodyParser = require('body-parser'),
	path = require('path'),
	chat = require('./socketio/chat.js'),
	log4js = require('log4js');

var PORT = process.env.PORT || 5555;

// Make a log directory, just in case it isn't there.
try {
	require('fs').mkdirSync('./log');
} catch (e) {
	if (e.code != 'EEXIST') {
		console.error("Could not set up log directory, error was: ", e);
		process.exit(1);
	}
}

var app = express();

app.use(express.static(__dirname + '/public'));
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

// Configure log4js
log4js.configure('./config/log4js.json');

var log = log4js.getLogger("app");
var logError = log4js.getLogger("Errors");

// Generate log file of access
app.use(log4js.connectLogger(log4js.getLogger("http"), { level: 'auto' }));

// Error handler
app.use(function(err, req, res, next) {
	logError.error(err);
});

app.route('/')
	.get(function(req, res) {
		res.sendFile(path.join(__dirname, './views/index.html'));
	});

var server = http.createServer(app);

chat.createChat(server).listen(PORT, function() {

	var processEnv = "development";
	if (process.env.NODE_ENV != null){
		processEnv = process.env.NODE_ENV;
	} else {
		process.env.NODE_ENV = processEnv;
	}

	log.info('Server listening on port', server.address().port, "in", processEnv, "mode with pid", process.pid);
});