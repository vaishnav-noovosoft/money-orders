const bcrypt = require('bcrypt');
const db = require('../db/postgres')

async function getHash(plainText) {
    try {
        const saltRounds = 8;
        return await bcrypt.hash(plainText, saltRounds);
    } catch (err) {
        console.error('Error hashing password:', err);
        throw err; // Rethrow the error to handle it at a higher level
    }
}

async function checkUser(username, plainPassword){
    try {
        const query = 'SELECT password from users WHERE username = $1';
        const values = [username];
        const result = await db.query(query, values);

        if(result.rows.length === 0) {
            return false;
        }

        const user = result.rows[0];
        return await bcrypt.compare(plainPassword, user.password);
    } catch (err) {
        console.error('Error while validating password: ', err);
        throw err;
    }
}

module.exports = {
    getHash,
    checkUser
}