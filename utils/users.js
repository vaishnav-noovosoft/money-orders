const db = require('../db/postgres');
const jwt=require('jsonwebtoken');

const getUser = async (username) => {
    try {
        const query = 'SELECT id, username, password, role, email FROM users WHERE username = $1';
        const values = [username];
        const result = await db.query(query, values);
        if(result.rows.length === 0) {
            return null;
        }

        return result.rows[0];
    } catch (err) {
        console.error('Error retrieving user: ', err);
        throw err;
    }
}

const getUserById = async (userId, client) => {
    try {
        const query = 'SELECT id, username, password, role, email FROM users WHERE id = $1';
        const values = [userId];
        const result = await client.query(query, values);
        if(result.rows.length === 0) {
            return null;
        }

        return result.rows[0];
    } catch (err) {
        console.error('Error retrieving user: ', err);
        throw err;
    }
}

module.exports = {
    getUser,
    getUserById
}