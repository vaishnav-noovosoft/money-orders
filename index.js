const dotenv = require('dotenv');
const {executeTransactions} = require("./utils/transaction");
const pool = require("./db/postgresPool");
const {sendEmails} = require("./utils/mail");
const {scheduleProcessExecution} = require("./utils/processes");
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
    const userRoutes = require('./routes/user-routes');
    const authRoutes = require('./routes/auth-routes');
    const transactionRoutes= require('./routes/transaction-routes');
    const siteRoutes = require('./routes/site-routes');
    const mailRoutes = require('./routes/mail-routes');

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

const startBatchProcessing = async () => {
    try {
        const client = await pool.connect();
        const jobLimit = 10;

        const fetchAndProcessOldestJobs = async () => {
            console.log('Fetching and processing jobs...');

            await scheduleProcessExecution(client, jobLimit);
            console.log('Job processing complete\n');
        };

        // Call the function initially to start the process.
        await fetchAndProcessOldestJobs();

        // Use setInterval to repeat the process every 10 seconds.
        setInterval(fetchAndProcessOldestJobs, 10000); // 10000 milliseconds = 10 seconds
    }
    catch (err) {
        console.error('Error processing transactions: ', err);
    }
};

const startServer = async () => {
    console.log(process.env.APP);

    if (process.env.APP === 'api') {
        apiServer();
    } else if(process.env.APP === 'batch-processing') {
        console.log('Starting job processing..');
        await startBatchProcessing();
    }
};

startServer().catch((error) => {
    console.error('Error starting the server:', error);
});
