const express = require('express');
const router = express.Router();
const {getUser} = require('../utils/users');
const {authenticate, adminOnly} = require("./middlewares");
const {retrieveUserTransactions} = require("../utils/transaction");
const client = require('../db/postgres');
const {createProcess} = require("../utils/processes");

router.use(authenticate);

router.get('/', async (req, res) => {
    const limit = req.query.limit;

    if (!limit) return res.status(400).json({error: 'Missing limit parameter'});

    try {
        const transactions = await retrieveUserTransactions(client, req.user, limit);
        return res.status(200).json({transactions});
    } catch (err) {
        console.error('Error retrieving transactions', err);
        return res.status(500).json({error: err.message});
    }
});

router.post('/', adminOnly, async (req, res) => {
    const {type} = req.query;
    try {
        const amount = req.body.amount;
        if (typeof amount !== 'number' || Number.isNaN (amount) ) {
            return res.status(400).json({error: 'Amount is not valid'})
        }

        if (type === 'deposit') {
            const {toUser} = req.body;

            if (!toUser || !amount) return res.status(400).json({error: 'Missing toUser or amount'});

            const user = await getUser(toUser);
            if (!user) return res.status(404).json({error: 'User not found'});

            const depositTransactionResult = await createProcess({
                status: 'PENDING',
                processType: 'TRANSACTION',
                transaction: {type: 'DEPOSIT', to_user: user.id, amount: amount}
            });
            return res.status(201).json({"transaction": depositTransactionResult});
        } else if (type === 'withdraw') {
            const {fromUser} = req.body;
            if (!fromUser || !amount) return res.status(400).json({error: 'Missing fromUser or amount'});

            const user = await getUser(fromUser);
            if (!user) return res.status(404).json({error: 'User not found'});

            const withdrawTransactionResult = await createProcess({
                status: 'PENDING',
                processType: 'TRANSACTION',
                transaction: {type: 'WITHDRAW', from_user: user.id, amount: amount}
            });
            if (!withdrawTransactionResult) return res.status(500).json({error: 'Error in creating transaction'});

            return res.status(201).json({"transaction": withdrawTransactionResult});
        } else if (type === 'transfer') {
            const {fromUser, toUser} = req.body;
            if (!fromUser || !toUser || !amount) return res.status(401).json({error: 'Missing required data'});

            if (fromUser === toUser) return res.status(400).json({error: 'Invalid parameters'});

            const fromUserObject = await getUser(fromUser);
            if (!fromUserObject) return res.status(404).json({error: 'fromUser not found'});

            const toUserObject = await getUser(toUser);
            if (!toUserObject) return res.status(404).json({error: 'toUser not found'});

            const transferTransactionResult = await createProcess({
                status: 'PENDING',
                processType: 'TRANSACTION',
                transaction: {type: 'TRANSFER', from_user: fromUserObject.id, to_user: toUserObject.id, amount: amount}
            });

            if (!transferTransactionResult) return res.status(500).json({error: 'Error while creating transaction'});

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

