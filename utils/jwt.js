const jwt = require('jsonwebtoken');

const sign = async (payload, expiresIn) => {
    const options = {
        expiresIn
    }
    try {
        return await jwt.sign(payload, process.env.JWT_SECRET, options);
    } catch (err) {
        console.error('Error generating JWT token');
        throw err;
    }
}

const verify = async (token) => {
    try {
        return await jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        console.error('Error verifying authentication token: ', err);
        throw err;
    }
}

module.exports = {
    sign,
    verify
}