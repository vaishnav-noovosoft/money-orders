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

module.exports = {
    sign
}