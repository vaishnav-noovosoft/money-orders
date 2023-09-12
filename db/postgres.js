const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables from .env file

const client = new Client({
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
});

// Connect to the database
client.connect()
    .then(() => {
        console.log('Connected to PostgreSQL database');
    })
    .catch((err) => {
        console.error('Error connecting to database:', err);
    });

module.exports = client;
