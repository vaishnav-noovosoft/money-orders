const express = require('express');
const router = express.Router();
const bcrypt = require('../utils/bcrypt');
const { getUser } = require('../utils/users');
const jwt = require('../utils/jwt');
const path = require('path');
const {verify} = require("../utils/jwt");

router.get('/login', async (req, res) => {
   const filePath =  path.join(__dirname, '..', 'templates', 'login.html');
   return res.sendFile(filePath);
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await getUser(username);
        if(!user) return res.status(404).json({ error: 'User not found' });

        const isValidUser = await bcrypt.verifyPassword(password, user.password);

        if(isValidUser) {
            const token = await jwt.sign(user, '1d');
            return res.status(200).json({ token, userRole: user.role });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (err) {
        console.error('Error authenticating user', err);
        res.status(500).json({ error: 'Error authenticating user' });
    }
});

const verifyAuthToken = async (req, res, next) => {
    const token = req.headers.authorization;

    if(!token) return res.status(401).json({ error: 'Missing authorization token' });
    const [bearer, authToken] = token.split(' ');

    if(bearer !== 'Bearer' || !authToken) return res.status(401).json({ error: 'Invalid auth token' });

    const user = await verify(authToken);
    if(!user) return res.status(404).json({ error: 'User not found' });

    req.user = user;
    next();
}

router.get('/verify-token', verifyAuthToken, async (req, res) => {
    return res.status(200).json({ message: 'ok' });
});

module.exports = router;