const express = require('express');
const router = express.Router();
const {retrieveMails} = require('../utils/mail');
const {authenticate} = require('../routes/middlewares');
const client = require('../db/postgres');
const {createProcess} = require("../utils/processes");

router.use(authenticate);

// Retrieve emails list
router.get('/', async (req, res) => {
    const user = req.user;
    const limit = req.query.limit;
    if(!limit) return res.status(400).json({ error: 'Invalid limit parameter' });

    try {
        // Retrieve emails of user
        const result= await retrieveMails(client, user.id, limit);
        return res.status(200).json({ emails: result });
    } catch (err) {
        console.error('Error retrieving emails: ', err);
        return res.status(500).json({ error: 'Error retrieving emails' });
    }
});

// Create email record
router.post('/transaction-history', async (req, res) => {
    const user = req.user;
    try {
        const limit = req.query.limit;
        if (!limit) return res.status(400).json({ error: 'Missing limit parameter' });

        const email = await createProcess({
            status: 'PENDING',
            processType: 'EMAIL',
            email: { receiver: user.id, transactionCount: limit }
        });
        return res.status(201).json({ email: email });
    } catch (err) {
        console.error('Error sending email: ', err);
        return res.status(500).json({ error: 'Error while sending mail' });
    }
});

module.exports = router;