const express = require('express');
const db = require("../db/postgres");
const router = express.Router();
const jwt = require('jsonwebtoken');
const {depositAmount, withdrawAmount, transferAmount} = require("../public/js/transaction");
const {getUser} = require('../utils/users');

const verifyType = async (req, res, next) => {
    try {
        const authHeader = req.header.authorization;
        const [bearer, token] = authHeader.split(' ');
        if (bearer !== 'Bearer' && !token) {
            return res.status(401).json({error: 'Invalid Authorization'})
        }
        const user = await jwt.verify(token);
        if (!user) {
            return res.status(404).json({error: 'User not found'});
        }
        const {role} = req.body.role;
        if (role === 'user' || role === 'admin') {
            next();
        } else {
            return res.status(400).json({error: 'Required Type not Present'})
        }
    } catch (err) {
        console.log('Error checking username Type', err);
        res.status(500).json({error: 'Server error'});
    }

}

router.post('/', verifyType, async (req, res) => {
    const type = req.body.query;

    try {

        if (type === 'deposit') {
            const {toUser, amount} = req.body;
            const user = await getUser(toUser);
            depositAmount(user, amount);
        } else if (type === 'withdraw') {
            const {fromUser, amount} = req.body;
            const user = await getUser(fromUser);
            withdrawAmount(user, amount);

        } else if (type === 'transfer') {
            // transerAmount(fromUser, toUser, amount);
            const {fromUser, toUser, amount} = req.body;
            const fromUserObject = await getUser(fromUser);
            const toUserObject = await getUser(toUser);
            transferAmount(fromUserObject, toUserObject, amount);
        }
    } catch (err) {
        res.status(500).json(err);
    }
})

module.exports = router;

