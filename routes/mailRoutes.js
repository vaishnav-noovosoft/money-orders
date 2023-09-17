const express = require('express');
const router = express.Router();
const {saveEmail, listEmails} = require('../utils/mail');
const {authenticate} = require('../routes/middlewares');

router.use(authenticate);

// Retrieve emails list
router.get('/', async (req, res) => {
    const user = req.user;
    const limit = req.query.limit;
    if(!limit) return res.status(400).json({ error: 'Invalid limit parameter' });

    try {
        // Retrieve emails of user
        const result= await listEmails(user.id, limit);
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

        await saveEmail({ receiver: user.id })
            .then((data)=> {
                if(data.error) {
                    console.error('Error sending email: ', data.error);
                    res.status(500).json({ error: 'Error sending email' });
                }
                else {
                    res.status(200).json({ message: data.message });
                }
            });
    } catch (err) {
        console.error('Error sending email: ', err);
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;