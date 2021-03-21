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

export default testData;