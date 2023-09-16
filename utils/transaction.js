const db = require("../db/postgres");
const pool = require("../db/postgresPool");

const addTransactionInProcess = async (client, transactionId) => {
    // Add transaction for batch processing
    const processQuery = 'INSERT INTO processes (transaction_id) VALUES ($1) RETURNING *';
    const processValues = [transactionId];
    const processResult = await client.query(processQuery, processValues);
    if(processResult.rows.length === 0) {
        console.error('Error adding transaction in processes');
    }
}

const depositTransaction = async (userId, amount) => {
    const client = await pool.connect();

    const depositQuery = 'INSERT INTO transactions (type, to_user, amount) VALUES ($1, $2, $3) RETURNING *';
    const depositValues = ['DEPOSIT', userId, amount];
    const result = await client.query(depositQuery, depositValues);

    if (result.rows.length === 0) {
        throw new Error('Error creating transaction');
    }
    const transaction = result.rows[0];

    // Add transaction for batch processing
    await addTransactionInProcess(client, transaction.id);

    return result.rows[0];
};

const withdrawTransaction = async (userId, amount) => {
    const client = await pool.connect();

    const withdrawQuery = 'INSERT INTO transactions (type, from_user, amount) values ($1, $2, $3) RETURNING *';
    const withdrawValues = ['WITHDRAW', userId, amount];
    const result = await db.query(withdrawQuery, withdrawValues);

    if (result.rows.length === 0) {
        throw new Error('Error creating transaction');
    }
    const transaction = result.rows[0];

    // Add transaction for batch processing
    await addTransactionInProcess(client, transaction.id);

    return result.rows[0];
}

const transferTransaction = async (fromUserId, toUserId, amount) => {
    const client = await pool.connect();

    // Store new transfer transaction
    const transferMoneyQuery = 'INSERT INTO transactions (type, from_user, to_user, amount) VALUES ($1, $2, $3, $4) RETURNING *';
    const transferMoneyValues = ['TRANSFER', fromUserId, toUserId, amount];
    const result = await client.query(transferMoneyQuery, transferMoneyValues);

    if (result.rows.length === 0) {
        throw 'Error creating transaction';
    }
    const transaction = result.rows[0];

    // Add transaction for batch processing
    await addTransactionInProcess(client, transaction.id);

    client.release();
    return transaction;
}

const retrieveTransactions = async (user = {}, limit = 15) => {
    if (user.role === 'admin') {
        const query = 'SELECT t.*, u.username AS from_username, v.username AS to_username\n' +
            'FROM transactions t\n' +
            'LEFT JOIN users u ON t.from_user = u.id\n' +
            'LEFT JOIN users v ON t.to_user = v.id\n' +
            'ORDER BY t.created_at DESC\n' +
            'LIMIT $1;';
        const values = [limit];
        const result = await db.query(query, values);

        return result.rows;
    } else if (user.role === 'user') {
        const query = 'SELECT t.*, u.username AS from_username, v.username AS to_username\n' +
            'FROM transactions t\n' +
            'LEFT JOIN users u ON t.from_user = u.id\n' +
            'LEFT JOIN users v ON t.to_user = v.id\n' +
            'WHERE (t."type" = \'DEPOSIT\' AND v.username = $1)\n' +
            '   OR (t."type" = \'WITHDRAW\' AND u.username = $1)\n' +
            '   OR (t."type" = \'TRANSFER\' AND (u.username = $1 OR v.username = $1))\n' +
            'ORDER BY t.created_at DESC\n' +
            'LIMIT $2;'
        const values = [user.username, limit];
        const result = await db.query(query, values);

        return result.rows;
    } else {
        return null;
    }
};

const fetchOldestTransactions = async (client) => {
    try {
        const query = 'SELECT *\n' +
            'FROM transactions\n' +
            'WHERE status = \'PENDING\'\n' +
            'ORDER BY created_at ASC\n' +
            'LIMIT 10;';
        const result = await client.query(query);
        return result.rows;
    } catch (err) {
        console.error('Error while retrieving transactions', err.message);
        throw err;
    }
}

const checkBalance = async (userId, transactionAmount, client) => {
    try {
        // Check if Transaction Amount can be deducted from User Balance
        const query = `
          SELECT balance FROM users WHERE id = $1;
        `;
        const values = [userId];
        const result = await client.query(query, values);
        const balance = result.rows[0].balance;

        return balance > transactionAmount;
    } catch (err) {
        console.error('Error while checking user amount: ', err.message);
        return false;
    }
}

const updateTransactionStatus = async (transactionId, status = '', client) => {
    try {
        const query = `
          UPDATE transactions
          SET status = $1
          WHERE id = $2
          RETURNING *;
        `;
        const values = [status, transactionId];
        const result = await client.query(query, values);

        return result.rows.length === 0;
    } catch (err) {
        console.error('Error while updating transaction status: ', err.message);
        return false;
    }
}

const depositAmount = async (to_user, amount, client) => {
    try {
        // Update user balance
        const updateUserBalanceQuery = `
                  UPDATE users
                  SET balance = balance + $1
                  WHERE id = $2;
                `;
        const updateUserBalanceValues = [amount, to_user];
        await client.query(updateUserBalanceQuery, updateUserBalanceValues);
    } catch (err) {
        throw err;
    }
}

const withdrawAmount = async (from_user, amount, client) => {
    try {
        // Update user balance
        const updateUserBalanceQuery = `
                  UPDATE users
                  SET balance = balance - $1
                  WHERE id = $2;
                `;
        const updateUserBalanceValues = [amount, from_user];
        await client.query(updateUserBalanceQuery, updateUserBalanceValues);
    } catch (err) {
        throw err;
    }
}

const transferAmount = async (to_user, from_user, amount, client) => {
    try {
        // Update from_user balance
        const updateFromUserBalanceQuery = `
                  UPDATE users
                  SET balance = balance - $1
                  WHERE id = $2;
                `;
        const updateFromUserBalanceValues = [amount, from_user];
        await client.query(updateFromUserBalanceQuery, updateFromUserBalanceValues);

        // Update balance of to_user
        const updateToUserBalanceQuery = `
                  UPDATE users
                  SET balance = balance + $1
                  WHERE id = $2;
                `;
        const updateToUserBalanceValues = [amount, to_user];
        await client.query(updateToUserBalanceQuery, updateToUserBalanceValues);
    } catch (err) {
        throw err;
    }
}

async function executeTransaction(client) {
    try {
        const transactions = await fetchOldestTransactions(client);

        // Return If No New Transactions to Process
        if(!transactions || transactions.length === 0) {
            console.log('No New Transactions to Process..');
            return;
        }

        for (const transaction of transactions) {
            const { type, from_user, to_user, amount } = transaction;

            if (type === 'DEPOSIT') {

                await updateTransactionStatus(transaction.id, 'PROCESSING', client);
                await depositAmount(to_user, amount, client);
                await updateTransactionStatus(transaction.id, 'COMPLETE', client);

            } else if (type === 'WITHDRAW') {
                // Check if user has sufficient balance
                const isSufficientBalance = await checkBalance(from_user, amount, client);
                if(!isSufficientBalance) {
                    // Invalid Transaction
                    await updateTransactionStatus(transaction.id, 'FAILED', client);
                    continue;
                }

                await withdrawAmount(from_user, amount, client);
                await updateTransactionStatus(transaction.id, 'COMPLETE', client);
            } else {
                // Transfer Transaction
                await updateTransactionStatus(transaction.id, 'PROCESSING', client);

                // Check if user has sufficient balance
                const isSufficientBalance = await checkBalance(from_user, amount, client);
                if(!isSufficientBalance) {
                    // Invalid Transaction
                    await updateTransactionStatus(transaction.id, 'FAILED', client);
                    continue;
                }

                await transferAmount(to_user, from_user, amount, client);
                await updateTransactionStatus(transaction.id, 'COMPLETE', client);
            }
        }
    } catch (err) {
        console.error('Error while completing transaction: ', err.message);
        throw err;
    }
}

module.exports = {
    depositTransaction,
    withdrawTransaction,
    transferTransaction,
    retrieveTransactions,
    executeTransaction
}

