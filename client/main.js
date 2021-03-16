import Diagram from "./js/diagram.js";
import InputManager from "./js/inputmanager.js";
import Animator from "./js/animator.js";
import * as client from "./js/webclient.js";

//Pretend like this came from a database request.
const testData = [
    {
        id: "178376b49b2-47d78811",
        diagramID: "1",
        class: "furniture",
        drawType: "furn_chair",
        name: "chair",
        color: "gray",
        color2: "darkgray", //https://i.redd.it/kngwbr8svar31.jpg
        posX: -4,
        posY: -2.5,
        size: 1.4,
        angle: Math.PI * 0.25
        //visible?
        //offstage?
    },
    {
        id: "178376bd722-3ce707b5",
        diagramID: "1",
        class: "furniture",
        drawType: "furn_chair",
        name: "chair",
        color: "gray",
        color2: "darkgray",
        posX: 4,
        posY: -2.5,
        size: 1.4,
        angle: Math.PI * 0.75
    },
    {
        id: "178376c1f97-f0fa6018",
        diagramID: "1",
        class: "actor",
        drawType: "actor",
        name: "Jane Doe",
        initials: "JD",
        color: "green",
        color2: "darkgreen",
        posX: 3,
        posY: 0,
        size: 0.75,
        angle: Math.PI
    },
    {
        id: "178376c5ebe-0ed6977d",
        diagramID: "1",
        class: "actor",
        drawType: "actor",
        name: "John Smith",
        initials: "JS",
        color: "blue",
        color2: "darkblue",
        posX: -3,
        posY: 0,
        size: 0.75,
        angle: 0
    }
];
//TODO / NOTE: diagramID will likely be in uniqueID format later

client.open("ws://localhost:3000", () => {
    client.send({
        type: "getAll",
        collection: "entities",
        data: {diagramID: "1"}
    }, function(data) {
        const canvas = document.getElementById("diagram");
        //Bare JSON is easy to feed into Diagram
        const diagram = new Diagram("1", canvas, data.result);
        diagram.width = window.innerWidth;
        diagram.height = window.innerHeight;
        diagram.windowX = diagram.width / diagram.scale / 2;
        diagram.windowY = diagram.height / diagram.scale / 2;

        new InputManager(diagram);

        diagram.draw();
    });
});

/*
const animator = new Animator(diagram);
animator.animateCross(diagram.entities[3], 2000, 0, -3, Math.PI, 500);
animator.animatePath(diagram.entities[2], 2000, [1, 3, 2], [3, 2, 1], 0, (x) => Math.pow(x, 3));
*/

/*
const testMessage = {
    type: "getAll",
    collection: "entities",
    data: {diagramID: "1"}
};
client.open("ws://localhost:3000", () => {
    //client.send(testMessage, (data) => console.log(data));
});
*/