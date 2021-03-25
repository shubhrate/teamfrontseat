# Blocking Diagram Client

Renders a virtual stage; allows actors, props, and other entities to be moved around on it. Integrates several different controllers for entities, including user input, animations or recorded motion playback, and remote control. Syncs to a database server.

## Setup

First, specify an IP address for the frontseat server. To ensure that IPs are kept off the repository, the server IP is defined in the .gitignored file /js/_addr.js. Create this file, then add the line `export const address = "ws://<address>:3000";`, where `<address>` is the IP address of the server (if you're running the server on your local machine, this should just be `localhost`).

Client-side JavaScript is built by Webpack. Run `npm install` to install Webpack and other dependencies, then run `npm run build` to build the code. The resulting file will be put in the /build directory, along with the site HTML files. Once the code is built, open /build/index.html in your browser of choice to mess with the client.

Note that `npm run build` produces a more debuggable but less minified development file. To build a smaller production file, run `npm run build-min`.

## The files

#### Base diagram files

[diagram.js](js/diagram.js) is where the good stuff is - it keeps track of entities, manages the canvas, controls size and position of the viewport, etc.

[entity.js](js/entity.js) has the classes for movable things.

[entitydraw.js](js/entitydraw.js) stores draw functions for different types of entities. This is so that you don't have to write extending classes for every entity that behaves the same but looks different.

#### Diagram controllers

[inputmanager.js](js/inputmanager.js) attaches to Diagram and takes in mouse events so you can move things around with the mouse and scroll wheel/two finger touch.

[animator.js](js/animator.js) provides a framework for animating objects on the diagram. It's currently in need of a rewrite.

#### Messaging

[webclient.js](js/webclient.js) manages a websocket, to get data from the server and pass it to the relevant object.