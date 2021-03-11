# Blocking Diagram Server

Communicates between diagram client that displays the canvas and the MongoDB database. Processes client requests and runs appropriate behaviors through database, then responds back to client.

## Setup

Add a .env file to backenfiles folder in local directory 

Within the .env file add the necessary connection string to connect to MongoDb Atlas database. 

`mongodb+srv://username:password@test.abgad.mongodb.net/Test?retryWrites=true&w=majority` 

Make sure your username and password here are from your information in the Database Access tab on Atlas. This information is different from your basic login and you will need to add a “new database user” in this tab in order to connect to it from your local machine.

$ `cd backendfiles` (to get into the server directory)
$ `npm install express mongoose`
$ `npm run start` (to start server)

## Folders

[Models] - where our objects, Characters, Diagram, Play, and User are stored as .js files

