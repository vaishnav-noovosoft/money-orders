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
        const query = `
            SELECT t.*, u.username AS from_username, v.username AS to_username, p.status
            FROM transactions t
            LEFT JOIN users u ON t.from_user = u.id
            LEFT JOIN users v ON t.to_user = v.id
            LEFT JOIN processes p ON t.id = p.transaction_id
            ORDER BY t.created_at DESC
            LIMIT $1;
        `;
        const values = [limit];
        const result = await db.query(query, values);

        return result.rows;
    } else if (user.role === 'user') {
        const query = `
            SELECT t.*, u.username AS from_username, v.username AS to_username, p.status
            FROM transactions t
            LEFT JOIN users u ON t.from_user = u.id
            LEFT JOIN users v ON t.to_user = v.id
            LEFT JOIN processes p ON t.id = p.transaction_id
            WHERE 
                (t."type" = 'DEPOSIT' AND t.to_user = $1)
                OR (t."type" = 'WITHDRAW' AND t.from_user = $1)
                OR (t."type" = 'TRANSFER' AND (t.from_user = $1 OR t.to_user = $1))
            ORDER BY t.created_at DESC
            LIMIT $2;
        `;
        const values = [user.id, limit];
        const result = await db.query(query, values);

        return result.rows;
    } else {
        return null;
    }
};

const fetchOldestTransactions = async (client, limit = 10) => {
    try {
        const query = `
            SELECT t.*, p.status
            FROM transactions t
            INNER JOIN processes p ON t.id = p.transaction_id
            WHERE p.status = 'PENDING'
            ORDER BY t.created_at ASC
            LIMIT $1;
        `;
        const values = [limit];
        const result = await client.query(query, values);
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

        return balance >= transactionAmount;
    } catch (err) {
        console.error('Error while checking user amount: ', err.message);
        return false;
    }
}

const updateTransactionStatus = async (transactionId, status = 'PROCESSING', client) => {
    try {
        const isComplete = status === 'COMPLETED';

        // For InComplete Transaction
        const inCompleteTransactionQuery = `
          UPDATE processes
          SET status = $1
          WHERE transaction_id = $2
          RETURNING *;
        `;
        const inCompleteTransactionValues = [status, transactionId];

        // For Complete Transaction
        const completeTransactionQuery = `
          UPDATE processes
          SET status = $1, completed_at = $2
          WHERE transaction_id = $3
          RETURNING *;
        `;
        const completeTransactionValues = [status, new Date().toUTCString(), transactionId]

        const result = isComplete ? await client.query(completeTransactionQuery, completeTransactionValues) : await client.query(inCompleteTransactionQuery, inCompleteTransactionValues);

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

async function executeTransactions(client, limit = 10) {
    try {
        const transactions = await fetchOldestTransactions(client, limit);

        // Return If No New Transactions to Process
        if(!transactions || transactions.length === 0) {
            console.log('No new transactions to process');
            return;
        }

        for (const transaction of transactions) {
            const { type, from_user, to_user, amount } = transaction;

            if (type === 'DEPOSIT') {
                await updateTransactionStatus(transaction.id, 'PROCESSING', client);
                await depositAmount(to_user, amount, client);
                await updateTransactionStatus(transaction.id, 'COMPLETED', client);

            } else if (type === 'WITHDRAW') {
                // Transfer Transaction
                await updateTransactionStatus(transaction.id, 'PROCESSING', client);

                // Check if user has sufficient balance
                const isSufficientBalance = await checkBalance(from_user, amount, client);
                if(!isSufficientBalance) {
                    // Invalid Transaction
                    await updateTransactionStatus(transaction.id, 'FAILED', client);
                    continue;
                }

                await withdrawAmount(from_user, amount, client);
                await updateTransactionStatus(transaction.id, 'COMPLETED', client);
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
                await updateTransactionStatus(transaction.id, 'COMPLETED', client);
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
    executeTransactions
}

