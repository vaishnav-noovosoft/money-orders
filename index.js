const dotenv = require('dotenv');
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



const startTransactionProcessing = () => {
    // Implement the function to fetch and process transactions here.
    const fetchAndProcessOldestTransactions = () => {
        // Implement code to fetch the oldest 10 transactions from the database
        // and perform operations on user balances here.
        // You'll need to use database queries to fetch the transactions and update user balances.
        // Pseudocode:
        // 1. Fetch the oldest 10 transactions.
        // 2. For each transaction, update the corresponding user's balance.
        // 3. Repeat this process every 10 seconds.
        console.log('Fetching and processing transactions...');
    };

    // Call the function initially to start the process.
    fetchAndProcessOldestTransactions();

    // Use setInterval to repeat the process every 10 seconds.
    setInterval(fetchAndProcessOldestTransactions, 10000); // 10000 milliseconds = 10 seconds
};

console.log(process.env.APP);

if(process.env.APP === 'api') {
    apiServer();
} else {
    console.log('Starting transaction processing..');
    startTransactionProcessing();
}
