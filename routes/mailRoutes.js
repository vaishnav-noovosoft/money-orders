const express = require('express');
const router = express.Router();
const mailhog = require('mailhog')({
    host: 'mailhog'
});



module.exports = router;