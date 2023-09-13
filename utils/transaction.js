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

module.exports = {
    depositAmount,
    withdrawAmount,
    transferAmount
}

