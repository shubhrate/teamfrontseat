/*
 * MotionClient
 *
 * Manages a WebSocket connection to a motion-capture data server.
 */
 
class MotionClient
{
  constructor()
	{
    // WebSocket object that manages the remote connection.
    this.webSocket = undefined;
    // Boolean flag set true if web socket has successfully opened its connection
    // and is ready to send and receive data.
    this.isWebSocketReady = false;
    // String that gives the address of the MOJO server.
    this.webSocketUri = undefined;
		
    // User-defined callback to process received data.
    this.dataHandler = undefined;
	}
	
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
  openWebSocket(wsUri, appCallback, appFailCallback) 
  {
    this.isWebSocketReady = false;
    this.webSocketUri = wsUri;
  
    this.appOnOpenCallback = appCallback;
    this.appOnCloseCallback = appFailCallback;
  
    // Create and open a WebSocket to the specified server address.
    this.webSocket = new WebSocket(wsUri); 
  
    // Define callback function to run when WebSocket has connected.
    this.webSocket.onopen = this.onWebSocketOpen.bind(this);
  
    // Define callback function to run when WebSocket has closed.
    this.webSocket.onclose = this.onWebSocketClose.bind(this);
  
    // Define callback function to run when WebSocket has received a message.
    this.webSocket.onmessage = this.onWebSocketMessage.bind(this);
  
    // Define callback function to run when WebSocket has an error.
    this.webSocket.onerror = this.onWebSocketError.bind(this); 
	}
	
  closeWebSocket(appOnCloseCallback)
  {
    this.errorMessage = "";
    if(this.webSocket)
    {
      this.appOnCloseCallback = appOnCloseCallback;
      this.webSocket.close();
      return true;
    }
    else
    {
      this.errorMessage = "Failed to send websocket message since socket is closed.";
      return false; 
    } 
  }
	
  onWebSocketOpen(evt) 
  { 
    this.isWebSocketReady = true;
    console.log("Mojo Client: Connected to server at " + this.webSocketUri); 
		// Call client-specified callback to report success.
    if(this.appOnOpenCallback)
      this.appOnOpenCallback();
  }
	
  onWebSocketClose(evt) 
  { 
    console.log("Mojo Client: Closed connection with server at " + this.webSocketUri); 
  
    this.errorMessage = "";
  
    // http://stackoverflow.com/questions/18803971/websocket-onerror-how-to-read-error-description
    var reason = "";
  
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
  
    this.isTrackingLive = false;
    this.isWebSocketReady = false;
    this.webSocketUri = undefined;
  
    if(this.appOnCloseCallback)
      this.appOnCloseCallback();
  }  

  /*
   * setDataHandler
   * Specify data handler function that is called by onWebSocketMessage
   * to process data received.
   * @param function object that receives one data argument.
   */
  setDataHandler(callbackFunction)
  {
    this.dataHandler = callbackFunction;
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
  
      var data = JSON.parse(evt.data);
      // I added this log in for testing 
      console.log("Data Packet: " + data);
		// console.log(JSON.stringify(data));
		
    // Invoke client-specified data-hander method to process data.
    if(this.dataHandler)
      this.dataHandler(data);
	}
	
  onWebSocketError(evt) 
  {  
    // evt.data is undefined.  See onWebSocketClose for gathering error message.
    console.log("Mojo Client: socket error");
  }	
}