const dotenv = require('dotenv');
const {executeTransaction} = require("./utils/transaction");
const pool = require("./db/postgresPool");
const {sendEmails} = require("./utils/mail");
dotenv.config();

const apiServer = () => {
    const express = require("express");
    const app = express();

    // Define a middleware to serve static files
    app.use(express.static('public')); // 'public' is the directory where your static files are located

    const bodyParser = require('body-parser');

    // Middleware for parsing JSON request bodies
    app.use(bodyParser.json());

    app.get("/api", (req
        , res) => {
        res.send("Welcome to Money Orders API");
    });

    // Mount routes
    const userRoutes = require('./routes/userRoutes');
    const authRoutes = require('./routes/authRoutes');
    const transactionRoutes= require('./routes/transactionRoutes');
    const siteRoutes = require('./routes/siteRoutes');
    const mailRoutes = require('./routes/mailRoutes');

    app.use('/api/users', userRoutes);
    app.use('/api/auth', authRoutes);
    app.use('/api/transactions', transactionRoutes);
    app.use('/', siteRoutes);
    app.use('/api/mail', mailRoutes);

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Server is listening on port ${port}`);
    });
}

const startTransactionProcessing = async () => {
    try {
        const client = await pool.connect();

        const fetchAndProcessOldestTransactions = async () => {
            console.log('Fetching and processing transactions...');

            await executeTransaction(client);
            console.log('Transaction Exit')
        };

        // Call the function initially to start the process.
        await fetchAndProcessOldestTransactions();

        // Use setInterval to repeat the process every 10 seconds.
        setInterval(fetchAndProcessOldestTransactions, 10000); // 10000 milliseconds = 10 seconds
    }
    catch (err) {
        console.error('Error processing transactions: ', err);
    }
};

const startEmailSending = async () => {
    try {
        const client = pool.connect();

        const fetchAndSendOldestMails = async () => {
            console.log('Sending emails..');
            await sendEmails(client);
            console.log('Email sending exit.');
        }

        await fetchAndSendOldestMails();
        setInterval(fetchAndSendOldestMails, 10000);
    }
    catch (err) {
        console.error('Error sending emails: ', err);
    }
}

const startServer = async () => {
    console.log(process.env.APP);

    if (process.env.APP === 'api') {
        apiServer();
    } else {
        console.log('Starting transaction processing..');
        await startTransactionProcessing();
    }
};

startServer().catch((error) => {
    console.error('Error starting the server:', error);
});
