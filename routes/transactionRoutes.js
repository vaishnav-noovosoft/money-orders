const express = require('express');
const db = require("../db/postgres");
const router = express.Router();
const jwt = require('../utils/jwt');
const {depositAmount, withdrawAmount, transferAmount} = require("../public/js/transaction");
const {getUser} = require('../utils/users');

const verifyType = async (req, res, next) => {
    try {

        const authHeader = req.headers.authorization;

        const [bearer, token] = authHeader.split(' ');

        if (bearer !== 'Bearer' && !token) {

            return res.status(401).json({error: 'Invalid Authorization'})

        }

        const user = await jwt.verify(token);
        if (!user) {
            console.log('user not found');
            return res.status(404).json({error: 'User not found'});
        }
        const {role} = req.body;

        if (role === 'user' || role === 'admin') {

            next();
        } else {
            console.log('role error');
            return res.status(400).json({error: 'Required Type not Present'})
        }
    } catch (err) {
        res.status(500).json({error: 'Server error'});
    }

}

router.post('/', verifyType, async (req, res) => {

    const {type} = req.query;
    console.log(type);

    try {

        if (type === 'deposit') {
            const {toUser, amount} = req.body;
            const user = await getUser(toUser);
            const depositTransaction = await depositAmount(user.user_id, amount);
            return res.status(201).json({"transaction": depositTransaction});
        }
        else if (type === 'withdraw') {
            const {fromUser, amount} = req.body;
            const user = await getUser(fromUser);
            const withdrawTransaction = await withdrawAmount(user.user_id, amount);
            return res.status(201).json({"transaction": withdrawTransaction});
        }
        else if (type === 'transfer') {
            const {fromUser, toUser, amount} = req.body;
            const fromUserObject = await getUser(fromUser);
            const toUserObject = await getUser(toUser);

            const transferTransaction = await transferAmount(fromUserObject.user_id, toUserObject.user_id, amount);
            console.log(transferTransaction);
            return res.status(201).json({"transaction": transferTransaction});
        }
    } catch (err) {
        res.status(500).json({error: err.message});
    }
})

module.exports = router;

