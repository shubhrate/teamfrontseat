const express = require('express');
const router = express.Router();
const Character = require('../models/Character');

//Get back all character objects from db
router.get('/', async (req, res) => {
    try{
        const characters = await Character.find(); //find is a mongoose method
        res.json(characters);
    }catch(err){
        res.json({message: err});
    }
});

//upload a character object to db
router.post('/', async (req,res) => {
    const character = new Character({ //const: pointer cannot be reassigned but can still manipulate data object
        name: req.body.name,
        play: req.body.play,
        description: req.body.description,
        actor: req.body.actor
    });

    try{
        const savedCharacter = await character.save(); //could instead create error handling funciton and save() that function
        res.json(savedCharacter);
    }catch(err){
        res.json({message: err});
    }
});

//Specific character
router.get('/:characterId', async (req, res) => {
    try{
        const play = await Play.findById(req.params.characterId);
        res.json(play);
    }catch(err){
        res.json({message: err});
    }
});

//Delete Character
router.delete('/:characterId', async (req, res) => {
    try{
        const removedCharacter = await Character.remove({_id: req.params.characterId});
        res.json(removedCharacter);
    }catch(err){
        res.json({message: err});
    }
});

//Update a character
router.patch(':characterId', async (req, res) => {
    try{
        const updatedCharacter = await Play.updateOne(
            { _id: req.params.characterId },
            { $set: { name: req.body.name} },
            { $set: { play: req.body.play} },
            { $set: { description: req.body.description} },
            { $set: { actor: req.body.actor} }
        );
        res.json(updatedCharacter);
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