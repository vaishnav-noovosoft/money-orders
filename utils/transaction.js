const db = require("../db/postgres");
const pool = require("../db/postgresPool");

const depositAmount = async (userId, amount) => {
    const depositQuery = 'INSERT INTO transactions (type, to_user, amount) VALUES ($1, $2, $3) RETURNING *';
    const depositValues = ['deposit', userId, amount];
    const result = await db.query(depositQuery, depositValues);

    if (result.rows.length === 0) {
        throw new Error('Error creating transaction');
    }
    return result.rows[0];
};
const withdrawAmount = async (userId, amount) => {
    const withdrawQuery = 'INSERT INTO transactions (type, from_user, amount) values ($1, $2, $3) RETURNING *';
    const withdrawValues = ['withdraw', userId, amount];
    const result = await db.query(withdrawQuery, withdrawValues);

    if (result.rows.length === 0) {
        throw new Error('Error creating transaction');
    }
    return result.rows[0];
}
const transferAmount = async (fromUserId, toUserId, amount) => {
    const transferMoneyQuery = 'INSERT INTO transactions (type, from_user, to_user, amount) values ($1, $2, $3, $4) RETURNING *';
    const transferMoneyValues = ['transfer', fromUserId, toUserId, amount];
    const result = await db.query(transferMoneyQuery, transferMoneyValues);

    if (result.rows.length === 0) {
        throw new Error('Error creating transaction');
    }
    return result.rows[0];
}

const retrieveTransactions = async (user = {}, userRole = '', limit = 0) => {
    if (userRole === 'admin') {
        const query = 'SELECT t.*, u.username AS from_username, v.username AS to_username\n' +
            'FROM transactions t\n' +
            'LEFT JOIN users u ON t.from_user = u.user_id\n' +
            'LEFT JOIN users v ON t.to_user = v.user_id\n' +
            'ORDER BY t.date_created DESC\n' +
            'LIMIT $1;';
        const values = [limit];
        const result = await db.query(query, values);

        return result.rows;
    } else if (userRole === 'user') {
        const query = 'SELECT t.*, u.username AS from_username, v.username AS to_username\n' +
            'FROM transactions t\n' +
            'LEFT JOIN users u ON t.from_user = u.user_id\n' +
            'LEFT JOIN users v ON t.to_user = v.user_id\n' +
            'WHERE (t."type" = \'deposit\' AND v.username = $1)\n' +
            '   OR (t."type" = \'withdraw\' AND u.username = $1)\n' +
            '   OR (t."type" = \'transfer\' AND (u.username = $1 OR v.username = $1))\n' +
            'ORDER BY t.date_created DESC\n' +
            'LIMIT $2;'
        const values = [user.username, limit];
        const result = await db.query(query, values);

        return result.rows;
    } else {
        return null;
    }
};

// Middleware to fetch the oldest 10 transactions
async function fetch1OldestTransactions(req, res, next) {
    try {
        // Fetch the oldest 10 transactions from the database
        const query = `
          SELECT *
          FROM transactions
          ORDER BY date_created ASC
          LIMIT 10;
        `;

        const { rows } = await pool.query(query);

        res.locals.oldestTransactions = rows;
        next();
    } catch (error) {
        next(error);
    }
}

// Function to fetch the oldest 10 transactions
async function fetchOldestTransactions() {
    try {
        // Fetch the oldest 10 transactions from the database
        const query = `
          SELECT *
          FROM transactions
          ORDER BY timestamp ASC
          LIMIT 10;
        `;

        const { rows } = await pool.query(query);

        return rows;
    } catch (error) {
        throw error;
    }
}

// Function to fetch the next 10 transactions
async function fetchNextTransactions(lastOldestTimestamp) {
    try {
        // Fetch the next 10 transactions after the provided timestamp
        const query = `
          SELECT *
          FROM transactions
          WHERE timestamp > $1
          ORDER BY timestamp ASC
          LIMIT 10;
        `;

        const { rows } = await pool.query(query, [lastOldestTimestamp]);

        return rows;
    } catch (error) {
        throw error;
    }
}

async function executeTransaction() {
    const client = await pool.connect(); // Get a client from the pool

    try {
        // Begin the transaction
        await client.query('BEGIN');

        // Perform your transaction operations using the client
        // For example, you can execute SQL statements here

        // If the transaction is successful, commit it
        await client.query('COMMIT');
    } catch (err) {
        // If an error occurs, rollback the transaction
        await client.query('ROLLBACK');
        throw err; // Handle the error or propagate it
    } finally {
        // Release the client back to the pool
        client.release();
    }
}

module.exports = {
    depositAmount,
    withdrawAmount,
    transferAmount,
    retrieveTransactions,
    fetch1OldestTransactions,
    fetchNextTransactions
}

