const express = require('express');
const router = express.Router();

const {authorize, authenticate} = require("./middlewares");
const {retrieveTransactions} = require("../utils/transaction");
const {saveEmail, listEmails} = require('../utils/mail');
const {getFirstAdmin} = require("../utils/users");

router.use(authenticate);
router.use(authorize);

router.get('/', async (req, res) => {
    const user = req.user;
    const limit = req.query.limit;

    if(!limit) return res.status(400).json({ error: 'Invalid limit parameter' });

    try {
        // Retrieve emails of user
        const result= await listEmails(user.user_id, limit);
        return res.status(200).json({ emails: result.emails });
    } catch (err) {
        console.error('Error retrieving emails: ', err);
        return res.status(500).json({ error: '' })
    }
});

router.post('/transaction-history', async (req, res) => {
    const user = req.user;

    try {
        const limit = req.query.limit;
        if (!limit) return res.status(400).json({ error: 'Missing limit parameter' });

        const latestTransactions = await retrieveTransactions(user, user.role, limit);
        if (!latestTransactions || latestTransactions.length === 0) {
            return res.status(200).json({ error: 'No Transactions to Send' });
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
                <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${transaction.date_created.toLocaleDateString()}</td>
                <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${transaction.date_created.toLocaleTimeString()}</td>
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
            <h1>Transaction History for User: ${user.username}</h1>
            ${transactionTable}
            <p>Thank you for using our service.</p>
          </body>
        </html>
        `;

        const adminId = getFirstAdmin().user_id;

        await saveEmail({ sender: adminId, receiver: user.user_id, emailBodyHTML: emailHtml })
            .then((data) => {
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