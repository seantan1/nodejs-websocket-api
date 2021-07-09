const webSocketsServerPort = 3997;
const webSocketServer = require('websocket').server;
const http = require('http');
// Spinning the http server and the websocket server.
const server = http.createServer();
server.listen(webSocketsServerPort);
const wsServer = new webSocketServer({
  httpServer: server
});

// Generates unique ID for every new connection
const getUniqueID = () => {
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return s4() + s4() + '-' + s4();
};

// Array of clients connected
const clients = {};
// Donation queue for alert
// let donationAlertQueue = [];
var donationAlertQueue = {};

const sendMessage = (json) => {
  // We are sending the current data to all connected clients
  Object.keys(clients).map((client) => {
    clients[client].sendUTF(json);
  });
}

const typesDef = {
  DONATION_EVENT: "donationevent",

}

// Donation alert broadcast - interval 7.5 seconds
setInterval(() => {
    Object.keys(donationAlertQueue).forEach(function (key) { 
        let queueInstance = donationAlertQueue[key];
        // console.log(queueInstance);
        if (queueInstance.length != 0) {
            const alert = queueInstance.shift();
            const json = { type: alert.type };
            json.data = { alert };
            sendMessage(JSON.stringify(json));
    
            // console.log("alert broadcasted at " + (new Date()))
        }
        // if key is empty, delete it to save memory
        else {
            delete donationAlertQueue[key];
        }
    })
    
}, 7500);
// setInterval(() => {
//     if (donationAlertQueue.length != 0) {
//         const alert = donationAlertQueue.shift();
//         const json = { type: alert.type };
//         json.data = { alert };
//         sendMessage(JSON.stringify(json));

//         // console.log("alert broadcasted at " + (new Date()))
//     }
// }, 7500);



wsServer.on('request', function(request) {
  var userID = getUniqueID();
  console.log((new Date()) + ' Recieved a new connection from origin ' + request.origin + '.');
  // You can rewrite this part of the code to accept only the requests from allowed origin
  const connection = request.accept(null, request.origin);
  clients[userID] = connection;
  console.log('connected: ' + userID + ' in ' + Object.getOwnPropertyNames(clients));

  connection.on('message', function(message) {
    if (message.type === 'utf8') {
      const dataFromClient = JSON.parse(message.utf8Data);
    //   const json = { type: dataFromClient.type };
        if (dataFromClient.type === typesDef.DONATION_EVENT) {
            console.log("donation received!");
            console.log("dataFromClient.content");
            console.log(dataFromClient);
            if (!donationAlertQueue[dataFromClient.streamer_id]) {
                donationAlertQueue[dataFromClient.streamer_id] = new Array();
                donationAlertQueue[dataFromClient.streamer_id].push(dataFromClient);
            }
            else {
                donationAlertQueue[dataFromClient.streamer_id].push(dataFromClient);
            }
            

            // json.data = { donationHistory, donationAlertQueue };
        }
    //   sendMessage(JSON.stringify(json));
    }
  });
  // user disconnected
  connection.on('close', function() {
    console.log((new Date()) + ": " + userID + " disconnected.");
    delete clients[userID];
  });
});
