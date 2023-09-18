const smtpTransport = require("nodemailer-smtp-transport");
const nodemailer = require("nodemailer");

const db = require('../db/postgres');
const pool = require('../db/postgresPool');

const {retrieveUserTransactions} = require("./transaction");

const mailhogTransport = smtpTransport({
    host: 'localhost',
    port: 1025,
});

const transporter = nodemailer.createTransport(mailhogTransport);

const sendEmail = async (client, userObject, transactionLimit = 10) => {
    try {
        // Verify the transporter configuration
        await transporter.verify();

        const latestTransactions = await retrieveUserTransactions(client, userObject, transactionLimit);
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
                <h1>Transaction History for ${userObject.username}</h1>
                ${transactionTable}
                <p>Thank you for using our service.</p>
              </body>
            </html>
            `;

        const mailOptions = {
            from: process.env.ADMIN_EMAIL,
            to: userObject.email,
            subject: `Transaction History of ${userObject.username}`,
            html: emailHtml
        }

        const info = await transporter.sendMail(mailOptions);
        return { message: info.response };
    }
    catch (err) {
        throw err;
    }
}

const retrieveMails = async (client, userId, mailLimit) => {
    const query = `
      SELECT
        id,
        status,
        email_receiver AS receiver,
        email_transaction_count AS transactionCount,
        created_at
      FROM processes
      WHERE type = $1 AND email_receiver = $2
      ORDER BY created_at DESC
      LIMIT $3;
    `;
    const values = ['EMAIL', userId, mailLimit];
    const result = await client.query(query, values);
    return result.rows;
}

module.exports = {
    sendEmail,
    retrieveMails
}