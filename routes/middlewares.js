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
    next();
}

const authorize = (req, res, next)=> {
    const role = req.user.role;

    if (role === 'user' || role === 'admin') {
        next();
    } else {
        return res.status(400).json({error: 'Invalid User Role'});
    }
}

const checkEmail = (req, res, next) => {
    const email = req.body.email;

    if(!email) return res.status(400).json({ error: 'Invalid Email' });

    const emailRegex = /^[\w\.-]+@[a-zA-Z\d\.-]+\.[a-zA-Z]{2,}$/;
    if(emailRegex.test(email)) next();

    return res.status(400).json({ error: 'Invalid Email' });
}

module.exports = {
    authenticate,
    authorize,
    checkEmail
}