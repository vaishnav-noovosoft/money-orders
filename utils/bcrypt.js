const bcrypt = require('bcrypt');

async function getHash(plainText) {
    try {
        const saltRounds = 8;
        return await bcrypt.hash(plainText, saltRounds);
    } catch (err) {
        console.error('Error hashing password:', err);
        throw err; // Rethrow the error to handle it at a higher level
    }
}

async function verifyPassword(plainPassword, storedPasswordHash){
    try {
        return await bcrypt.compare(plainPassword, storedPasswordHash);
    } catch (err) {
        console.error('Error while validating password: ', err);
        throw err;
    }
}

module.exports = {
    getHash,
    verifyPassword
}