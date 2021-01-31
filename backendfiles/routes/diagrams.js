onst express = require('express');
const router = express.Router();
const Diagram = require('../models/Diagram');

//Get back all diagram objects from db
router.get('/', async (req, res) => {
    try{
        const diagrams = await Diagram.find(); //find is a mongoose method
        res.json(diagrams);
    }catch(err){
        res.json({message: err});
    }
});

//upload a diagram object to db
router.post('/', async (req,res) => {
    const diagram = new Diagram({
        diagramID: req.body.diagramID,
        entities: req.body.entities
    });

    try{
        const savedDiagram = await diagram.save();
        res.json(savedDiagram);
    }catch(err){
        res.json({message: err});
    }
});

//Specific diagram
router.get('/:diagramId', async (req, res) => {
    try{
        const diagram = await Diagram.findById(req.params.diagramId);
        res.json(diagram);
    }catch(err){
        res.json({message: err});
    }
});

//Delete diagram
router.delete('/:diagramId', async (req, res) => {
    try{
        const removedDiagram = await Diagram.remove({_id: req.params.diagramId});
        res.json(removedDiagram);
    }catch(err){
        res.json({message: err});
    }
});

//Update a diagram
router.patch(':diagramId', async (req, res) => {
    try{
        const updatedDiagram = await Diagram.updateOne(
            { _id: req.params.diagramId },
            { $set: { entities: req.body.entities} }
        );
        res.json(updatedDiagram);
    }catch(err){
        res.json({message: err});
    }
});

//Export router
module.exports = router;
