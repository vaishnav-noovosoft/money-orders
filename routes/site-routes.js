const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/dashboard', async (req, res) => {
    const filePath = path.join(__dirname, '..', 'templates', 'dashboard.html');
    return res.sendFile(filePath);
});

module.exports = router;