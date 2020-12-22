const express = require('express');
const router = express.Router();
const User = require('../models/User');

//Get back all user objects from db
router.get('/', async (req, res) => {
    try{
        const users = await User.find(); //find is a mongoose method
        res.json(users);
    }catch(err){
        res.json({message: err});
    }
});

//upload a user object to db
router.post('/', async (req,res) => {
    const user = new User({
        name: req.body.name,
        password: req.body.password,
    });

    try{
        const savedUser = await user.save();
        res.json(savedUser);
    }catch(err){
        res.json({message: err});
    }
});

//Specific user
router.get('/:userId', async (req, res) => {
    try{
        const user = await User.findById(req.params.userId);
        res.json(user);
    }catch(err){
        res.json({message: err});
    }
});

//Delete User
router.delete('/:userId', async (req, res) => {
    try{
        const removedUser = await User.remove({_id: req.params.userId});
        res.json(removedUser);
    }catch(err){
        res.json({message: err});
    }
});

//Update a user
router.patch(':userId', async (req, res) => {
    try{
        const updatedUser = await User.updateOne(
            { _id: req.params.userId },
            { $set: { name: req.body.name} },
            { $set: { password: req.body.password} }
        );
        res.json(updatedUser);
    }catch(err){
        res.json({message: err});
    }
});

//Export router
module.exports = router;