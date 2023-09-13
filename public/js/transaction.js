const express = require('express');
const db = require("../../db/postgres");
const router = express.Router();
const jwt = require('jsonwebtoken');

const depositMoney = async (userId, amount) => {
    const depositQuery = 'INSERT INTO transactions (type, to_user, amount) VALUES ($1, $2, $3) RETURNING *';
    const depositValues = ['deposit', userId, amount];
    const result = await db.query(depositQuery, depositValues);

    if (result.rows.length === 0) {
        throw new Error('Error creating transaction');
    }
    return result.rows[0];
};
const withdrawMoney = async (userId, amount) => {
    const withdrawQuery = 'INSERT INTO transactions (type, from_user, amount) values ($1, $2, $3) RETURNING *';
    const withdrawValues = ['withdraw', userId, amount];
    const result = await db.query(withdrawQuery, withdrawValues);

    if (result.rows.length === 0) {
        throw new Error('Error creating transaction');
    }

    return result.rows[0];
}
const transferMoney = async (fromUserId, toUserId, amount) => {
    const transferMoneyQuery = 'INSERT INTO transactions (type, from_user, to_user, amount) values ($1,$2,$3,#4) RETURNING *';
    const transferMoneyValues = ['transfer', fromUserId, toUserId, amount];
    const result = await db.query(transferMoneyQuery, transferMoneyValues);

    if (result.rows.length === 0) {
        throw new Error('Error creating transaction');
    }

    return result.rows[0];
}


const depositAmount = async (toUser, Amount) => {
    try {
        return await depositMoney(toUser, Amount);
    } catch (error) {
        throw error;
    }
};


const withdrawAmount = async (fromUser, Amount) => {
    try {

        return await withdrawMoney(fromUser, Amount);
    } catch (error) {
        throw error;
    }
}

const transferAmount = async (fromUser, toUser, Amount) => {
    try {
        return await transferMoney(fromUser, toUser, Amount);
    } catch (error) {
        throw error;
    }
}

module.exports = {
    depositAmount,
    withdrawAmount,
    transferAmount
}

