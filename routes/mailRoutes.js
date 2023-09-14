const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const {getUser} = require("../utils/users");
const {checkEmail, authorize, authenticate} = require("./middlewares");

const mailhogTransport = smtpTransport({
    host: 'localhost',
    port: 1025,
});

const transporter = nodemailer.createTransport(mailhogTransport);

router.use(checkEmail);

router.use(authenticate);
router.use(authorize);

router.post('/transaction-history/send', async (req, res) => {
    const user = req.user;

    const mailOptions = {
        from: process.env.ADMIN_EMAIL,
        to: user.email,
    }
});


module.exports = router;