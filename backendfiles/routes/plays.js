const express = require('express');
const router = express.Router();
const Play = require('../models/Play');

//Get back all play objects from db
router.get('/', async (req, res) => {
    try{
        const plays = await Play.find(); //find is a mongoose method
        res.json(plays);
    }catch(err){
        res.json({message: err});
    }
});

//upload a play object to db
router.post('/', async (req,res) => {
    const play = new Play({
        title: req.body.title,
        description: req.body.description,
        characters: req.body.characters,
        stageID: req.body.stageID,
        script: req.body.script
    });

    try{
        const savedPlay = await play.save();
        res.json(savedPlay);
    }catch(err){
        res.json({message: err});
    }
});

//Specific play
router.get('/:playId', async (req, res) => {
    try{
        const play = await Play.findById(req.params.playId);
        res.json(play);
    }catch(err){
        res.json({message: err});
    }
});

//Delete Play
router.delete('/:playId', async (req, res) => {
    try{
        const removedPlay = await Play.remove({_id: req.params.playId});
        res.json(removedPlay);
    }catch(err){
        res.json({message: err});
    }
});

//Update a play
router.patch(':playId', async (req, res) => {
    try{
        const updatedPlay = await Play.updateOne(
            { _id: req.params.playId },
            { $set: { title: req.body.title} },
            { $set: { description: req.body.description} },
            { $set: { characters: req.body.characters} },
            { $set: { stageID: req.body.stageID} },
            { $set: { script: req.body.script} }
        );
        res.json(updatedPlay);
    }catch(err){
        res.json({message: err});
    }
});

//Export router
//module.exports = router;

//not sure if this code would be redundant, but gives us access to io
module.exports = function(io) {
    var router = express.Router();
    //define routes
    //io is available in this scope
    //router.get(...);
    return router;
}