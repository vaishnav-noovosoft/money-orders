const jwt = require("../utils/jwt");

const authenticate = async (req, res, next)=> {
    const authHeader = req.headers.authorization;
    const [bearer, token] = authHeader.split(' ');

    if (bearer !== 'Bearer' && !token) {
        return res.status(401).json({error: 'Invalid Authentication Format'});
    }

    const user = await jwt.verify(token);
    if (!user) return res.status(404).json({error: 'User Not Found'});

    req.user = user;
    req.role = user.role;
    next();
}

const authorize = async (req, res, next)=> {
    const role = req.role;

    if (role === 'user' || role === 'admin') {
        next();
    } else {
        return res.status(400).json({error: 'Invalid User Role'});
    }
    next();
}

module.exports = {
    authenticate,
    authorize
}