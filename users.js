const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.get('/', (req, res) => {
    res.send('We are on users'); //displays message when get request to users endpoint
});

router.post('/', (req,res) => {
    const user = new User({
        name: req.body.name,
        password: req.body.password,
    });

    user.save()
    .then(data => {
        res.json(data); //output on screen
    })
    .catch(err => {
        res.json({message: err});
    });
});

//Export router
module.exports = router;