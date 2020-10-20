# Blocking Diagram Client

Here's my start on a front-end system for moving abstract actors and props around on a virtual stage. I tried to write it with extensibility and ease of connecting to a database server in mind.

Note that most browsers don't like it when sites ask for certain files from your local machine, or ask for them in a certain way, or something. So this has to be running on an HTTP server to work at the moment. For testing on Windows I've been navigating a command line to the folder and running `py -m http.server`. Then point a browser tab at localhost:8000 and you should be able to test it out.

## Base diagram files

[diagram.js](js/diagram.js) is where the good stuff is - it keeps track of entities, manages the canvas, controls size and position of the viewport, etc.

[entity.js](js/entity.js) has the classes for movable things.

[entitydraw.js](js/entitydraw.js) stores draw functions for different types of entities, so that you don't have to 

## Diagram controllers

[inputmanager.js](js/inputmanager.js) attaches to Diagram and takes in mouse events so you can move things around with the mouse and scroll wheel/two finger touch.

[animator.js](js/animator.js) provides a framework for animating objects on the diagram.

[timeline.js](js/timeline.js) stores and manages a timeline of blocking actions. For best results, give it an animator.

[websocket.js](js/websocket.js) manages a websocket, to get data from the server and pass it to the relevant object.