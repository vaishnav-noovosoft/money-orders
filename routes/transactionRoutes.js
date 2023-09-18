const express = require('express');
const router = express.Router();
const {
    depositTransaction,
    withdrawTransaction,
    transferTransaction,
    retrieveTransactions,
} = require("../utils/transaction");
const {getUser} = require('../utils/users');
const {authenticate, adminOnly} = require("./middlewares");

router.use(authenticate);

router.get('/', async (req, res) => {
    const limit = req.query.limit;

    if (!limit) return res.status(400).json({error: 'Missing limit parameter'});

    try {
        const transactions = await retrieveTransactions(req.user, limit);
        return res.status(200).json({transactions});
    } catch (err) {
        console.error('Error retrieving transactions', err);
        return res.status(500).json({error: err.message});
    }
});

router.post('/', adminOnly, async (req, res) => {
    const {type} = req.query;

    try {
        if (type === 'deposit') {
            const {toUser, amount} = req.body;

            if (typeof amount !== 'number' || Number.isNaN ( amount ) ) {
                res.status(400).json({error: 'Amount is not valid'})
            }

            if (!toUser || !amount) return res.status(400).json({error: 'Missing toUser or amount'});

            const user = await getUser(toUser);
            if (!user) return res.status(404).json({error: 'User not found'});

            const depositTransactionResult = await depositTransaction(user.id, amount);
            return res.status(201).json({"transaction": depositTransactionResult});
        } else if (type === 'withdraw') {
            const {fromUser, amount} = req.body;
            if (!fromUser || !amount) return res.status(400).json({error: 'Missing fromUser or amount'});

            const user = await getUser(fromUser);
            if (!user) return res.status(404).json({error: 'User not found'});

            const withdrawTransactionResult = await withdrawTransaction(user.id, amount);
            if (!withdrawTransaction) return res.status(500).json({error: 'Error in creating transaction'});

            return res.status(201).json({"transaction": withdrawTransactionResult});
        } else if (type === 'transfer') {
            const {fromUser, toUser, amount} = req.body;
            if (!fromUser || !toUser || !amount) return res.status(401).json({error: 'Missing required data'});

            if (fromUser === toUser) return res.status(400).json({error: 'Invalid parameters'});

            const fromUserObject = await getUser(fromUser);
            if (!fromUserObject) return res.status(404).json({error: 'fromUser not found'});

            const toUserObject = await getUser(toUser);
            if (!toUserObject) return res.status(404).json({error: 'toUser not found'});

            const transferTransactionResult = await transferTransaction(fromUserObject.id, toUserObject.id, amount);
            if (!transferTransaction) return res.status(500).json({error: 'Error while creating transaction'});

            return res.status(201).json({"transaction": transferTransactionResult});
        } else {
            return res.status(401).json({error: "Missing required parameter 'type'"});
        }
    } catch (err) {
        console.error('Error creating transaction: ', err);
        res.status(500).json({error: 'Error making transaction'});
    }
});

module.exports = router;

