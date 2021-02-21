const express = require('express');
const expressWs = require('express-ws');
const router = express.Router();

router.ws('/', (ws, req) => {
    console.log("Client connected.");

    ws.on('message', (msg) => {
        console.log(msg);
    });

    ws.on('close', () => {
        console.log("Client disconnected.");
    });
});

module.exports = router;