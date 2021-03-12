/*
 * MOJO Web Client for mapping tracker motion to animated scene properties.
 * 
 * @author William Bares
 * Copyright 2015-17 by William Bares and Donald Schwartz.
 * All rights reserved.
 */
 
// Import required module dependencies.
// The ./ assumes dependency source file is in same folder as this source file.
const MojoServerState = require("./MojoServerState.js");
// No ./ needed since WebSocket was installed by npm install ws
const WebSocket = require('ws');

class MojoClient
{
	constructor() {
		console.log("MojoClient constructor...");		
		
    // WebSocket object that manages the remote connection.
    this.webSocket = undefined;
    // Boolean flag set true if web socket has successfully opened its connection
    // and is ready to send and receive data.
    this.connectedWebSocket = false;
    // String that gives the address of the MOJO server.
    this.webSocketUri = undefined;
  		
    // Application-defined callback to process received sensor data.
    this.appOnDataHandler = undefined;
  
    // Application-defined callback to process server responses to client commands.
    this.appOnReplyHandler = undefined;

    // Application-defined callback to on successful connection to server.
		this.appOnOpenConnectionHandler = undefined;
		
    // Application-defined callback to on closed connection to server.
		this.appOnCloseConnectionHandler = undefined;
		
		// Client's copy of Mojo server state with all attribute
		// values changed on receipt of server responses.
		this.serverState = new MojoServerState();
		
		console.log(JSON.stringify(this.serverState));
  }
	
	//----- Application-defined callbacks respond to Mojo Server events ----
	
  /*
   * setDataHandler
   * Set application-defined callback function on receipt of sensor data message.
	 *
   * @param function object that receives one message data argument.
	 * message data object is of the form { time: 0, channels: [ { .... }, ... ] }.
	 * The sensor data message contains a timestamp and list of sensor channel data.
   */
  setDataHandler(callbackFunction)
  {
    this.appOnDataHandler = callbackFunction;
  }

  /*
   * setReplyHandler
   * Set application-defined callback function on receipt of server reply message.
   * The server will send reply messages to confirm receipt of client messages
	 * that request change in Mojo Server state to read, pause, record, etc.
	 *
   * @param function object that receives one reply argument.
	 * The reply argument is of the form { reply: COMMAND_NAME, ... }
	 * COMMAND_NAME is equal to the original client command name to which
	 * this message is responding.
   */
  setReplyHandler(callbackFunction)
  {
    // User-defined callback to process received command replies.
    this.appOnReplyHandler = callbackFunction;
  }
	
  /*
   * setConnectedHandler
   * Set application-defined callback function on successful connection to Mojo Server.
   * @param function object receives no arguments.
   */
	setConnectedHandler(callbackFunction)
	{
		this.appOnOpenConnectionHandler = callbackFunction;
	}
	
  /*
   * setDisonnectedHandler
   * Set application-defined callback function on closed connection to Mojo Server.
   * @param function object receives no arguments.
   */
	setDisonnectedHandler(callbackFunction)
	{
		this.appOnCloseConnectionHandler = callbackFunction;
	}
	
  /*
   * setErrorHandler
   * Set application-defined callback function on errors from Mojo Server.
   * @param function object receives one argument - error message string.
   */
	setErrorHandler(callbackFunction)
	{
		this.appOnErrorHandler = callbackFunction;
	}
	
	//---------- Open and Close Socket Connection to Mojo Server --------
	
	/*
	 * connect
   * @param {integer} serverPortNumber - port number of WebSocket used by a motion tracker server.
   * @param {string} serverIpAddress - WebSocket IP address, example "192.168.10.1" or for
   *        server on localhost use "localhost" or "" empty string.
   */
  connect(serverPortNumber, serverIpAddress)
  {  		
		// Use default IP address string "localhost"
		if(serverIpAddress == undefined || serverIpAddress === "")
			serverIpAddress = "localhost";
			
    // Construct websocket protocol address URI Uniform Resource Identifier.
    // Sample wsUri for localhost -   ws://localhost:8080
    let wsUri = "ws://" + serverIpAddress + ":" + serverPortNumber;
  
		if(this.isConnected())
      this.disconnect();
    this.openWebSocket(wsUri);	
  }
	
  disconnect()
  {
    this.errorMessage = "";
    if(this.webSocket)
    {
      this.webSocket.close();
      return true;
    }
    else
    {
      this.errorMessage = "Failed to send websocket message since socket is closed.";
      return false; 
    } 
  }	

	/*
	 * isConnected
	 * @return {boolean} true if WebSocket is connected to the server; else, false.
	 */
  isConnected()
  {
    return this.webSocket && this.connectedWebSocket;
  }

  isErrorMessage()
  {
    return this.errorMessage.length > 0;
  }

  getErrorMessage()
  {
    return this.errorMessage;
  }

	//------------------------------------------------------------	
	//------------- Send Messages to Mojo Server -----------------
	//------------------------------------------------------------

  /*
	 * sendMessageOpenSensor
	 * Open/Close sensor device.
	 * @param {boolean} enabledFlag - true to open sensor,
	 *        false to close sensor.
	 */
  sendMessageOpenSensor(enabledFlag)
  {
		if(this.isBoolean(enabledFlag)) {
      let messg = {};
      messg.cmd = "OpenSensor";
		  messg.state = enabledFlag;
      this.sendMessage(JSON.stringify(messg));
		}
  }	
	
  /*
	 * sendMessageReadSensor
	 * @param {integer} enabledFlag - true to enable reading,
	 *        0 to stop reading.
	 */
  sendMessageReadSensor(enabledFlag)
  {
		if(this.isBoolean(enabledFlag)) {
      let messg = {};
      messg.cmd = "ReadSensor";
		  messg.state = enabledFlag;
      this.sendMessage(JSON.stringify(messg));
		}
  }

  /*
	 * sendMessageBroadcast
	 * @param {boolean} enabledFlag - true to enable broadcast to client(s),
	 *        false to stop broadcasting.
	 */
  sendMessageBroadcast(enabledFlag)
  {
		if(this.isBoolean(enabledFlag)) {
      let messg = {};
      messg.cmd = "Broadcast";
		  messg.state = enabledFlag;
      this.sendMessage(JSON.stringify(messg));
		}
  }
	
  /*
	 * sendMessageRecord
	 * @param {integer} enabledFlag - true to enable server data recording,
	 *        false to stop server-side recording.
	 */
  sendMessageRecord(enabledFlag)
  {
		if(this.isBoolean(enabledFlag)) {
      let messg = {};
      messg.cmd = "Record";
		  messg.state = enabledFlag;
      this.sendMessage(JSON.stringify(messg));
		}
  }

  sendMessageSetFrameRate(fps)
  {
		if(this.isNonNegativeInteger(fps))
		{    
			let messg = {};
			messg.cmd = "SetFrameRate";
			messg.fps = Math.floor(fps);
			this.sendMessage(JSON.stringify(messg));
		}
	}

  sendMessageGetMaxFrameRate()
  {    
    let messg = {};
    messg.cmd = "GetMaxFrameRate";
    this.sendMessage(JSON.stringify(messg));
  }

  sendMessageSetNumRigidBodies(numRigidBodies)
  {
    if(this.isNonNegativeInteger(numRigidBodies))
		{
			let messg = {};
			messg.cmd = "SetNumRigidBodies";
			messg.num = Math.floor(numRigidBodies);
			this.sendMessage(JSON.stringify(messg));
		}
	}
	
	/*
	 * sendMessageGetSensorDetails
	 * Request details about motion sensor device or data source.
	 * Example server reply message as a JavaScript object:
	 * { reply: "GetSensorDetails", 
	 *   details: {
	 *              source: { device: "Polhemus Patriot", fps: 30 },
   *              format: { type: "RigidBody", orientation: "quaternion" },
   *              bounds: { minX: -45.2445, maxX: 31.3632, 
   *                        minY: -67.1919, maxY: -53.9842,
   *                        minZ: -89.6014, maxZ: 266.253 }
	 *            }
	 * }
	 */
	sendMessageGetSensorDetails() {
    let messg = {};
    messg.cmd = "GetSensorDetails";
    this.sendMessage(JSON.stringify(messg));		
	}

  /*
   * sendMessage
   * Send message to server via web socket connection.
   * @param message Message as a JSON-formatted string.
   * @return true if socket exists and is ready; else, false.
   */
  sendMessage = function(message) 
  { 
    this.errorMessage = "";
    if(this.isConnected())
    {
      this.webSocket.send(message); 
      console.log("Send to server " + this.webSocketUri + " : " + message);
      return true;    
    } 
    else
    {
      this.errorMessage = "Failed to send websocket message since socket is closed.";
      return false; 
    }    
  }	
	
	//------------------------------------------------------------	
	//----- Private Socket Functions -----------------------------
	//------------------------------------------------------------

  /*
   * openWebSocket
   * Initialize websocket connection with specified server.
   * Initialize callback functions that will respond to websocket events.
   *
   * @param wsUri Location URL of websocket server given as a string.
   *              For example, "ws://echo.websocket.org/"
   * Note that a ws:// and wss:// prefix are proposed to indicate a WebSocket 
   * and a secure WebSocket connection, respectively.
   * Additional examples and notes:
   *   To connect to a server on localhost at port 8080:
   *     ws://localhost:8080
   *   To connect to a server computer having a given IP address on port 8080:
   *     ws://ppp.ppp.ppp.ppp:8080
   * If you are using a router, be sure to use the IP address of the server 
   * computer and not the IP address of the router.  
   * To find the IP address of a server computer do the following:
   *    On Windows, open a command prompt and type ipconfig /all
   *    Read off the IPv4 Address as the preferred IP address of your server.
   * See www.websocket.org for more details and examples of websockets.
   */
  openWebSocket(wsUri) 
  {
    this.errorMessage = "";

    this.connectedWebSocket = false;
    this.webSocketUri = wsUri;
  
    // Create and open a WebSocket to the specified server address.
    this.webSocket = new WebSocket(wsUri); 
  
    // Define callback function to run when WebSocket has connected.
    this.webSocket.onopen = this.onWebSocketOpen.bind(this);
  
    // Define callback function to run when WebSocket has received a message.
    this.webSocket.onmessage = this.onWebSocketMessage.bind(this);
  
    // Define callback function to run when WebSocket has an error.
    this.webSocket.onerror = this.onWebSocketError.bind(this); 
		
    // Define callback function to run when WebSocket has closed.
    this.webSocket.onclose = this.onWebSocketClose.bind(this);
  }	
	
  onWebSocketOpen = function(evt) 
  { 
    this.connectedWebSocket = true;
    console.log("Mojo Client: Connected to server at " + this.webSocketUri); 
		
    if(this.appOnOpenConnectionHandler)
      this.appOnOpenConnectionHandler();
  } 
	
  /*
   * onWebSocketMessage
   * Client-side processing of message received from server.
   *
   * @param evt Websocket message received from server.
   */
  onWebSocketMessage(evt) 
  { 
    // Do not ask if(evt.hasOwnProperty("data")) - first attempt to access 'data'
    // attribute consumes it.
  
    let messg = JSON.parse(evt.data);
  
		// If message has channels, then it contains sensor data.
    if(messg.hasOwnProperty("channels")) {
      if(this.appOnDataHandler != undefined)
        this.appOnDataHandler(messg);
    }
		// If message has reply, then it contains server's response to a client message.
    else if(messg.hasOwnProperty("reply")) {
			console.log("MojoClient: received reply...");
			console.log(JSON.stringify(messg));
	  
			// Reply is in response to which command?
			let cmd = messg.reply;
			
			// Update MojoServerState.
			if(cmd == "OpenSensor") {
				this.serverState.openedSensor = (messg.state > 0);
			}			
			else if(cmd == "ReadSensor") {
				this.serverState.enabledReadSensor = (messg.state > 0);
			}
			else if(cmd == "Broadcast") {
				this.serverState.enabledBroadcast = (messg.state > 0);
			}	
			else if(cmd == "Record") {
				this.serverState.enabledRecord = (messg.state > 0);
			}
			else if(cmd == "SetFrameRate") {
				if(messg.fps > 0)
					this.serverState.updateRate = messg.fps;
			}
			else if(cmd == "SetNumRigidBodies") {
				if(messg.num > 0)
					this.serverState.numRigidBodies = messg.num;
			}	
			else if(cmd == "GetSensorDetails") {
				if(messg.details != undefined) {
					let details = messg.details;
					if(details.source != undefined)
						this.serverState.source = details.source;
					if(details.dataFormat != undefined)
						this.serverState.dataFormat = details.dataFormat;
					if(details.bounds != undefined)
						this.serverState.bounds = details.bounds;
					if(details.numRigidBodies != undefined)
						this.serverState.numRigidBodies = details.numRigidBodies;
					console.log(JSON.stringify(this.serverState));
				}
			}
	
			// Call optional, user defined callback function.
			if(this.appOnReplyHandler != undefined)
				this.appOnReplyHandler(messg);
		}// end else message is a reply.
	} 
	
	onWebSocketError(evt) 
  {  
    // evt.data is undefined.  See onWebSocketClose for gathering error message.
    console.log("Mojo Client: socket error: " + evt.data);
		
		// Call optional, user defined callback function.
			if(this.appOnErrorHandler != undefined)
				this.appOnErrorHandler(messg);
  }

  onWebSocketClose = function(evt) 
  { 
    console.log("Mojo Client: Closed connection with server at " + this.webSocketUri); 
  
    this.errorMessage = "";
  
    // http://stackoverflow.com/questions/18803971/websocket-onerror-how-to-read-error-description
		let reason = "";
  
		if (evt.code == 1000)
      reason = "Normal closure, meaning that the purpose for which the connection was established has been fulfilled.";
		else if(evt.code == 1001)
      reason = "An endpoint is \"going away\", such as a server going down or a browser having navigated away from a page.";
    else if(evt.code == 1002)
      reason = "An endpoint is terminating the connection due to a protocol error";
    else if(evt.code == 1003)
      reason = "An endpoint is terminating the connection because it has received a type of data it cannot accept (e.g., an endpoint that understands only text data MAY send this if it receives a binary message).";
    else if(evt.code == 1004)
      reason = "Reserved. The specific meaning might be defined in the future.";
    else if(evt.code == 1005)
      reason = "No status code was actually present.";
    else if(evt.code == 1006)
      reason = "The connection was closed abnormally, e.g., without sending or receiving a Close control frame";
    else if(evt.code == 1007)
      reason = "An endpoint is terminating the connection because it has received data within a message that was not consistent with the type of the message (e.g., non-UTF-8 [http://tools.ietf.org/html/rfc3629] data within a text message).";
    else if(evt.code == 1008)
      reason = "An endpoint is terminating the connection because it has received a message that \"violates its policy\". This reason is given either if there is no other sutible reason, or if there is a need to hide specific details about the policy.";
    else if(evt.code == 1009)
      reason = "An endpoint is terminating the connection because it has received a message that is too big for it to process.";
    else if(evt.code == 1010) // Note that this status code is not used by the server, because it can fail the WebSocket handshake instead.
      reason = "An endpoint (client) is terminating the connection because it has expected the server to negotiate one or more extension, but the server didn't return them in the response message of the WebSocket handshake. <br /> Specifically, the extensions that are needed are: " + event.reason;
    else if(evt.code == 1011)
      reason = "A server is terminating the connection because it encountered an unexpected condition that prevented it from fulfilling the request.";
    else if(evt.code == 1015)
      reason = "The connection was closed due to a failure to perform a TLS handshake (e.g., the server certificate can't be verified).";
    else
      reason = "Unknown reason";  
  
		if (evt.code != 1000)
			this.errorMessage = reason;
  
		this.connectedWebSocket = false;
		this.webSocketUri = undefined;
		
		this.serverState.clear();
  
		if(this.appOnCloseConnectionHandler)
			this.appOnCloseConnectionHandler();
	}

	isBoolean(value) {
		return value != undefined && (value === true || value === false);
	}
	
	isNonNegativeInteger(value) {
		return value != undefined && !isNaN(value) && value >= 0 && Number.isInteger(value);
	}

}

MojoClient.AXIS_POS_X = 1;
MojoClient.AXIS_POS_Y = 2;
MojoClient.AXIS_POS_Z = 3;
MojoClient.AXIS_NEG_X = 4;
MojoClient.AXIS_NEG_Y = 5;
MojoClient.AXIS_NEG_Z = 6;

MojoClient.UNITS_METERS = 1;
MojoClient.UNITS_CENTIMETERS = 2;
MojoClient.UNITS_MILLIMETERS = 3;
MojoClient.UNITS_FEET = 4;
MojoClient.UNITS_INCHES = 5;

MojoClient.HANDEDNESS_RIGHT = 1;
MojoClient.HANDEDNESS_LEFT = 2;

MojoClient.MIN_FRAME_RATE = 1;
MojoClient.MAX_FRAME_RATE = 120;

MojoClient.MIN_RIGID_BODIES = 1;
MojoClient.MAX_RIGID_BODIES = 8;

// Export entire class by adding class name to global list of exports.
module.exports = MojoClient;

// How to export a Module for use in Node.js
// https://www.digitalocean.com/community/tutorials/how-to-create-a-node-js-module