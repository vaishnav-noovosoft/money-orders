const smtpTransport = require("nodemailer-smtp-transport");
const nodemailer = require("nodemailer");
const db = require('../db/postgres');


const mailhogTransport = smtpTransport({
    host: 'localhost',
    port: 1025,
});

const transporter = nodemailer.createTransport(mailhogTransport);

const sendEmail = async (user, emailHtml) => {
    try {
        const mailOptions = {
            from: process.env.ADMIN_EMAIL,
            to: user.email,
            subject: `Transaction History of ${user.username}`,
            html: emailHtml
        }

        await transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                return { error: err.message };
            } else {
                return { message: info.response };
            }
        });
    }
    catch (err) {
        throw err;
    }
}

const saveEmail = async ({ sender= '', receiver = '', emailBodyHTML = '' }) => {
    try {
        const query = `
            INSERT INTO emails (sender, receiver, emailhtml)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const values = [sender, receiver, emailBodyHTML];
        const result = await db.query(query, values);

        if(result.rows.length === 0) return { 'error': 'Error sending mail' };
        return { 'message': 'Email sent successfully' };
    }
    catch (err) {
        throw err;
    }
};

const listEmails = async (receiverUserId, limit= 10) => {
    try {
        const query = `
            SELECT *
            FROM emails
            WHERE receiver = $1
            ORDER BY created_at DESC
            LIMIT $2;
        `;
        const values = [receiverUserId, limit];
        const result = await db.query(query, values);

        return { 'emails': result.rows };
    }
    catch (err) {
        throw err;
    }
}

module.exports = {
    sendEmail,
    saveEmail,
    listEmails
}