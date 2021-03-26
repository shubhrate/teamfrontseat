# Blocking Diagram Server

Communicates between diagram client that displays the canvas and the MongoDB database. Processes client requests and runs appropriate behaviors through database, then responds back to client.

## Setup

Add a .env file to backendfiles folder in local directory 

Within the .env file add the necessary connection string to connect to MongoDb Atlas database. 

`DB_CONNECTION=mongodb+srv://username:password@test.abgad.mongodb.net/Test?retryWrites=true&w=majority` 

Make sure your username and password here are from your information in the Database Access tab on Atlas. This information is different from your basic login and you will need to add a “new database user” in this tab in order to connect to it from your local machine.

$ `cd backendfiles` (to get into the server directory)
$ `npm install` (to install all dependencies listed in package.json "dependencies")
$ `npm run start` or `npm start` (to start server)

You should see:

[nodemon] 2.0.5
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): *.*
[nodemon] watching extensions: js,mjs,json
[nodemon] starting `node app.js`
connected to DB!

This means the server is now running!

## Folders

[Models] - where our Diagram, Entity, Play, and User schemas are stored as .js files

