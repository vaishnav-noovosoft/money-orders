const db = require("../db/postgres");

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
            'WHERE u.username = $1 OR v.username = $1\n' +
            'ORDER BY t.date_created DESC\n' +
            'LIMIT $2';
        const values = [user.username, limit];
        const result = await db.query(query, values);

        return result.rows;
    } else {
        return null;
    }
};


module.exports = {
    depositAmount,
    withdrawAmount,
    transferAmount,
    retrieveTransactions
}

