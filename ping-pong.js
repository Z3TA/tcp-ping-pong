var module_net = require('net');

var WAIT = 100;
var MSG_COUNT = 0;
var MSG_STATUS = "";
var MSG_ERRORS = 0;
var MSG_SUCCESS = 0;
var INTERVAL_TIME = 10000;

function main() {
	var type = process.argv[2];
	var host = process.argv[3];

	WAIT = process.argv[4] || WAIT;

	if(typeof host != "string") return usage();

	var arrHost = host.split(":");
	var ip = arrHost[0];
	var port = arrHost[1];

	console.log("ip=" + ip + " port=" + port + " type=" + type);

	if(!ip || !port) return usage();

	if(type == "-c" || type == "client") startClient(port, ip);
	else if(type == "-s" || type == "server") startServer(port, ip);
	else return usage();

	setInterval(stats, INTERVAL_TIME);

}

function stats() {
	var d = new Date();
	var timeStamp = d.toLocaleString();
	console.log( d + ": rate=" + MSG_COUNT/INTERVAL_TIME * 1000 + " msg/s MSG_ERRORS=" + MSG_ERRORS + " MSG_SUCCESS=" + MSG_SUCCESS + " " );

	MSG_COUNT = 0;
}

function usage() {
	console.log("Usage:");
	console.log("Start client: -c hostname/ip");
	console.log("Start server: -s ip:port");
	process.exit(1);
}

function startServer(port, ip) {
	var server = module_net.createServer(function(c) { //'connection' listener
		console.log('client connected');
		c.on('end', function() {
			console.log('client disconnected');
		});
		c.on('error', function(err) {
			console.log('client error: ' + err.message);
		});
		c.on('data', function(data) {
			MSG_COUNT++;

			var str = data.toString();
			//console.log('client str=' + str);

			var cmd = str.slice(0,4);
			var data = str.slice(5, -2);

			if(cmd == "ping") {
				c.write("pong " + data + "[]");
				MSG_SUCCESS++;
			}
			else {
				console.log("Unknown: cmd=" + cmd + " data=" + data);
				MSG_ERRORS++;
			}
			
		});

	});
	server.listen(port, ip, function() { //'listening' listener
		console.log('server bound to ' + ip + ":" + port);
	});
}

function startClient(port, ip) {
	var lastPing = "";

	var client = module_net.connect({host: ip, port: port},	function() { //'connect' listener
		console.log('connected to port ' + port + ' on ' + ip + ' !');
		sendPing();
	});
	client.on('data', function(data) {
		MSG_COUNT++;

		var str = data.toString();
		//console.log('server resp: ' + str);

		var cmd = str.slice(0,4);
		var data = str.slice(5,-2);

		if(cmd == "pong") {
			if(data == lastPing) {
				MSG_SUCCESS++;
			}
			else {
				console.log("Wrong: data=" + data + " lastPing=" + lastPing);
				MSG_ERRORS++;
			}
		}
		else {
			console.log("Unknown: cmd=" + cmd + " data=" + data);
			MSG_ERRORS++;
		}

		setTimeout(sendPing, WAIT);
	});
	client.on('end', function() {
		console.log('disconnected from server');
	});
	client.on('error', function(err) {
		console.log('connection error: ' + err.message);
		if(callback) callback(err);
	});

	function sendPing() {
		lastPing = randomString();
		client.write('ping ' + lastPing + '{}');
	}

}

function randomString() {
	return "abcdefghijklmnopqrstuvwxyzåäö"
}

main();
