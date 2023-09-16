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

const fetchOldestEmails = async (client, limit = 10) => {
    try {
        const query = 'SELECT *\n' +
            'FROM emails\n' +
            'WHERE status = \'pending\'\n' +
            'ORDER BY created_at ASC\n' +
            'LIMIT $1;';
        const values = [limit];
        return await client.query(query, values);
    }
    catch (err) {
        throw err;
    }
}

const sendEmails = async (client, limit) => {
    try {
        const mails = await fetchOldestEmails(client, limit);

        if(!mails || mails.length === 0) {
            console.log('No New Mails to Process..');
            return;
        }

        for(const mail of mails) {
            const {} = mail;
        }
    }
    catch (err) {
        console.error('Error in sending emails process');
        throw err;
    }
}

const saveEmail = async ({ sender, receiver, emailBodyHTML = '' }) => {
    try {
        const query = `
            INSERT INTO emails (sender, receiver, emailhtml)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const values= [sender, receiver, emailBodyHTML];
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
            WITH email_data AS (
                SELECT
                    u.email AS sender_email,
                    emails.created_at AS created_at,
                    emails.status AS email_status
                FROM
                    emails
                        INNER JOIN
                    users u ON emails.sender = u.id
                WHERE
                    emails.receiver = $1
            )
            SELECT
                sender_email,
                created_at,
                email_status
            FROM
                email_data
            ORDER BY
                created_at DESC
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
    saveEmail,
    listEmails,
    sendEmails
}