const smtpTransport = require("nodemailer-smtp-transport");
const nodemailer = require("nodemailer");
const db = require('../db/postgres');
const pool = require('../db/postgresPool');
const {retrieveTransactions} = require("./transaction");
const {startSession} = require("pg/lib/crypto/sasl");
const {getUserById} = require("./users");


const mailhogTransport = smtpTransport({
    host: 'localhost',
    port: 1025,
});

const transporter = nodemailer.createTransport(mailhogTransport);

const sendEmail = async (user, limit = 10) => {
    try {
        const latestTransactions = await retrieveTransactions(user, limit);
        if (!latestTransactions || latestTransactions.length === 0) {
            return;
        }

        // Create an HTML table to display the selected transaction properties
        const transactionTable = `
            <table style="border-collapse: collapse; width: 100%;">
              <thead>
                <tr style="background-color: #f2f2f2;">
                  <th style="border: 1px solid #dddddd; text-align: left; padding: 8px;">Transaction Type</th>
                  <th style="border: 1px solid #dddddd; text-align: left; padding: 8px;">Amount</th>
                  <th style="border: 1px solid #dddddd; text-align: left; padding: 8px;">Date</th>
                  <th style="border: 1px solid #dddddd; text-align: left; padding: 8px;">Time</th>
                </tr>
              </thead>
              <tbody>
                ${latestTransactions.map((transaction, index) => `
                  <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f2f2f2'};">
                    <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${transaction.type}</td>
                    <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${transaction.amount}</td>
                    <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${transaction.created_at.toLocaleDateString()}</td>
                    <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${transaction.created_at.toLocaleTimeString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            `;

        // Create the HTML content for the email
        const emailHtml = `
            <html lang="en">
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Transaction History</title>
                <style>
                  body {
                    font-family: Arial, sans-serif;
                    background-color: #f5f5f5;
                    margin: 0;
                    padding: 0;
                  }
                  h1 {
                    background-color: #007bff;
                    color: #ffffff;
                    padding: 20px;
                    text-align: center;
                  }
                  p {
                    text-align: center;
                  }
                </style>
              </head>
              <body>
                <h1>Transaction History for ${user.username}</h1>
                ${transactionTable}
                <p>Thank you for using our service.</p>
              </body>
            </html>
            `;

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
        const query = `
            SELECT e.*, u.email AS receiver_email, p.status
            FROM emails e
            INNER JOIN users u ON e.receiver = u.id
            INNER JOIN processes p ON e.id = p.email_id
            WHERE p.status = 'PENDING'
            ORDER BY e.created_at ASC
            LIMIT $1;
        `;
        const values = [limit];
        const result = await client.query(query, values);
        return result.rows;
    } catch (err) {
        throw err;
    }
};

const updateEmailProcessStatus = async (client, status = 'PROCESSING', emailId) => {
    const isComplete = status === 'COMPLETED'
    const inCompleteEmailQuery = `
      UPDATE processes
      SET status = $1
      WHERE email_id = $2
      RETURNING *;
    `;
    const inCompleteEmailValues = [status, emailId];

    const completeEmailQuery = `
      UPDATE processes
      SET status = $1, completed_at = $2
      WHERE email_id = $3
      RETURNING *
    `;
    const completeEmailValues = [status, new Date().toUTCString(), emailId];

    const result = isComplete ? await client.query(completeEmailQuery, completeEmailValues) : await client.query(inCompleteEmailQuery, inCompleteEmailValues);
    return result.rows.length !== 0;
}

const sendEmails = async (client, limit = 10) => {
    try {
        const mails = await fetchOldestEmails(client, limit);
        if(!mails || mails.length === 0) {
            console.log('No new mails to process..');
            return;
        }

        for(const mail of mails) {
            const { receiver } = mail;
            const userObject = await getUserById(receiver, client);

            if(!userObject) {
                console.error('User not found to send email');
                return;
            }

            // Put email process in processing state
            await updateEmailProcessStatus(client, 'PROCESSING', mail.id);
            sendEmail(userObject, limit)
                .then(async data => {
                    await updateEmailProcessStatus(client, 'COMPLETED', mail.id);
                })
                .catch(err => {
                    console.error('Error sending email', err);
                });
        }
    }
    catch (err) {
        console.error('Error in sending emails process');
        throw err;
    }
}

const addEmailInProcess = async (client, emailId) => {
    const query = `INSERT INTO processes (email_id) VALUES ($1) RETURNING *`;
    const values = [emailId];
    const result = await client.query(query, values);

    if(result.rows.length === 0) console.error('Error adding email into processes');
}

const saveEmail = async ({ receiver })=> {
    try {
        const client = await pool.connect();
        const query = `
            INSERT INTO emails (receiver)
            VALUES ($1)
            RETURNING *;
        `;
        const values= [receiver];
        const result = await client.query(query, values);

        if(result.rows.length === 0) return { 'error': 'Error sending mail' };
        const email = result.rows[0];

        // Add email for scheduling in process
        await addEmailInProcess(client, email.id);

        return { 'message': 'Email sent successfully' };
    }
    catch (err) {
        throw err;
    }
};

const listEmails = async (receiverUserId, limit= 10) => {
    try {
        const query = `
          SELECT e.*, p.status
          FROM emails e
          INNER JOIN processes p ON p.email_id = e.id
          WHERE receiver = $1 
          ORDER BY created_at 
          LIMIT $2;
        `;
        const values = [receiverUserId, limit];
        const result = await db.query(query, values);

        return result.rows;
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