const express = require('express');
const db = require("../../db/postgres");
const router = express.Router();
const jwt = require('jsonwebtoken');

const depositMoney = async (userId, amount) => {
    const depositQuery = 'INSERT INTO transactions (type, to_user, amount) VALUES ($1, $2, $3)';
    const depositValues = ['deposit', userId, amount];
    await db.query(depositQuery, depositValues);
};
const withdrawMoney = async (userId, amount) => {
    const withdrawQuery = 'INSERT INTO transactions (type, from_user, amount) values ($1, $2, $3)';
    const withdrawValues = ['withdraw', userId, amount];
    await db.query(withdrawQuery, withdrawValues);
}
const transferMoney = async (fromUserId, toUserId, amount) => {
    const transferMoneyQuery = 'INSERT INTO transactions (type, from_user,to_user,amount) values ($1,$2,$3,#4)';
    const transferMoneyValues = ['transfer', fromUserId, toUserId, amount];
    await db.query(transferMoneyQuery, transferMoneyValues);
}


const depositAmount = async (toUser, Amount) => {
    try {
        await depositMoney(toUser, Amount);
    } catch (error) {
        throw error;
    }
};


const withdrawAmount = async (fromUser, Amount) => {
    try {

        await withdrawMoney(fromUser, Amount);
    } catch (error) {
        throw error;
    }
}

const transferAmount = async (fromUser, toUser, Amount) => {
    try {

        await transferMoney(fromUser, toUser, Amount);
    } catch (error) {
        throw error;
    }
}

module.exports = {
    depositAmount,
    withdrawAmount,
    transferAmount
}

