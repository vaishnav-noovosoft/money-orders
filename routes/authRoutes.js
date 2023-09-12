const express = require('express');
const router = express.Router();
const db = require('../db/postgres');
const { checkUser } = require('../utils/bcrypt');

// Login user
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const isValidUser = await checkUser(username, password);

        if(isValidUser) {

        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (err) {
        console.error('Error authenticating user', err);
        res.status(500).json({ error: 'Error authenticating user' });
    }
});

module.exports = router;