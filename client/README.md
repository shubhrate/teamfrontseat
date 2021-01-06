# Blocking Diagram Client

Renders a virtual stage; allows actors, props, and other entities to be moved around on it. Integrates several different controllers for entities, including user input, animations or recorded motion playback, and remote control. Syncs to a database server.

## Setup

This project uses Webpack now! Run `npm install` to resolve dependencies (currently only Webpack itself), then run `npm run build` to build the code. Once you've done that, open build/index.html to test it out.

Before Webpack, this code ran into browser policy errors: apparently browsers don't like it when you try to make certain requests for external files while running a site locally, even if those files are also on your local machine. Because Webpack now crunches the module dependency tree that used to cause these problems into a single file, this should no longer be an issue. However, there's a chance you'll encounter similar problems again when adding and testing a feature, like client-server interaction. So, if you encounter trouble and the browser console says it has something to do with "CORS," the solution is to host the code on an http server. For testing on Windows I navigated a command line to the folder and ran `py -m http.server`. Then point a browser tab at localhost:8000 and things ought to work again.

## The files

#### Base diagram files

[diagram.js](js/diagram.js) is where the good stuff is - it keeps track of entities, manages the canvas, controls size and position of the viewport, etc.

[entity.js](js/entity.js) has the classes for movable things.

[entitydraw.js](js/entitydraw.js) stores draw functions for different types of entities. This is so that you don't have to write extending classes for every entity that behaves the same but looks different.

#### Diagram controllers

[inputmanager.js](js/inputmanager.js) attaches to Diagram and takes in mouse events so you can move things around with the mouse and scroll wheel/two finger touch.

[animator.js](js/animator.js) provides a framework for animating objects on the diagram.

timeline.js *future* connects to an animator and stores and manages a timeline of blocking actions.

#### Messaging

[webclient.js](js/webclient.js) manages a websocket, to get data from the server and pass it to the relevant object.