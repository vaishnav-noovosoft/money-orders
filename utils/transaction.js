const db = require("../db/postgres");
const pool = require("../db/postgresPool");
const {getUser} = require("./users");

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

const fetchOldestTransactions = async (client) => {
    try {
        const query = 'SELECT *\n' +
            'FROM transactions\n' +
            'WHERE status = \'pending\'\n' +
            'ORDER BY date_created ASC\n' +
            'LIMIT 10;';
        const result = await client.query(query);
        return result.rows;
    } catch (err) {
        console.error('Error while retrieving transactions', err);
        throw err;
    }
}

const checkBalance = async (user_id, transactionAmount, client) => {
    try {
        // Check if Transaction Amount can be deducted from User Balance
        const query = `
          SELECT balance FROM users WHERE user_id = $1;
        `;
        const values = [user_id];
        const result = await client.query(query, values);
        const balance = result.rows[0].balance;

        return balance > transactionAmount;
    } catch (err) {
        console.error('Error while checking user amount: ', err);
        return false;
    }
}

const updateTransactionStatus = async (transaction_id, status = '', client) => {
    try {
        const query = `
          UPDATE transactions
          SET status = $1
          WHERE transaction_id = $2
          RETURNING *;
        `;
        const values = [status, transaction_id];
        const result = await client.query(query, values);

        return result.rows.length === 0;
    } catch (err) {
        console.error('Error while updating transaction status: ', err);
        return false;
    }
}

const deposit = async (to_user, amount, client) => {
    try {
        // Update user balance
        const updateUserBalanceQuery = `
                  UPDATE users
                  SET balance = balance + $1
                  WHERE user_id = $2;
                `;
        const updateUserBalanceValues = [amount, to_user];
        await client.query(updateUserBalanceQuery, updateUserBalanceValues);
    } catch (err) {
        throw err;
    }
}

const withdraw = async (from_user, amount, client) => {
    try {
        // Update user balance
        const updateUserBalanceQuery = `
                  UPDATE users
                  SET balance = balance - $1
                  WHERE user_id = $2;
                `;
        const updateUserBalanceValues = [amount, from_user];
        await client.query(updateUserBalanceQuery, updateUserBalanceValues);
    } catch (err) {
        throw err;
    }
}

const transfer = async (to_user, from_user, amount, client) => {
    try {
        // Update from_user balance
        const updateFromUserBalanceQuery = `
                  UPDATE users
                  SET balance = balance - $1
                  WHERE user_id = $2;
                `;
        const updateFromUserBalanceValues = [amount, from_user];
        await client.query(updateFromUserBalanceQuery, updateFromUserBalanceValues);

        // Update balance of to_user
        const updateToUserBalanceQuery = `
                  UPDATE users
                  SET balance = balance + $1
                  WHERE user_id = $2;
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

            if (type === 'deposit') {

                await updateTransactionStatus(transaction.transaction_id, 'in-process', client);
                await deposit(to_user, amount, client);
                await updateTransactionStatus(transaction.transaction_id, 'complete', client);

            } else if (type === 'withdraw') {
                // Check if user has sufficient balance
                const isSufficientBalance = await checkBalance(from_user, amount, client);
                if(!isSufficientBalance) {
                    // Invalid Transaction
                    await updateTransactionStatus(transaction.transaction_id, 'invalid', client);
                    continue;
                }

                await withdraw(from_user, amount, client);
                await updateTransactionStatus(transaction.transaction_id, 'complete', client);
            } else {
                // Transfer Transaction
                await updateTransactionStatus(transaction.transaction_id, 'in-process', client);

                // Check if user has sufficient balance
                const isSufficientBalance = await checkBalance(from_user, amount, client);
                if(!isSufficientBalance) {
                    // Invalid Transaction
                    await updateTransactionStatus(transaction.transaction_id, 'invalid', client);
                    continue;
                }

                await transfer(to_user, from_user, amount, client);
                await updateTransactionStatus(transaction.transaction_id, 'complete', client);
            }
        }

        // Release the client back to the pool
        // client.release();
    } catch (err) {
        console.error('Error while completing transaction: ', err);
        throw err;
    }
}

module.exports = {
    depositAmount,
    withdrawAmount,
    transferAmount,
    retrieveTransactions,
    executeTransaction
}

