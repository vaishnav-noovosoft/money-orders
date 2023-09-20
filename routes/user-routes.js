const express = require("express");
const router = express.Router();
const db = require("../db/postgres");
const { getHash } = require("../utils/bcrypt");

// Check username is unique or not
const checkUniqueUsername = async (req, res, next) => {
    try {
        const { username } = req.body;
        const query = 'SELECT * FROM users WHERE username = $1';
        const values = [username];
        const result = await db.query(query, values);

        if(result.rows.length === 0) {
            // The username is unique; continue to the next middleware
            next();
        } else {
            // The username is already taken; send a response with an error
            res.status(400).json({ error: 'Username is already taken' });
        }
    } catch (err) {
        console.error('Error checking username uniqueness:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// List Users
router.get('/', async (req, res) => {
   try {
       const query = 'SELECT username FROM users';
       const result = await db.query(query);
       res.status(200).json({ users: result.rows });
   } catch (err) {
       console.error('Error retrieving users', err);
       res.status(500).json({ error: 'Error retrieving users' });
   }
});

// Create a new user
router.post('/', checkUniqueUsername, async (req, res) => {
    try {
        const { username, password, role, email } = req.body;
        if(!username || !password || !role || !email) return res.status(400).json({ error: 'Missing Required Fields in Request Body' });

        const hashedPassword = await getHash(password);
        const query = 'INSERT INTO users (username, password, role, email) VALUES ($1, $2, $3, $4) RETURNING *';
        const values = [username, hashedPassword, role, email];
        const result = await db.query(query, values);

        res.status(201).json({user: { username: result.rows[0].username, role: result.rows[0].role }});
    } catch (err) {
        console.error('Error creating user: ', err);
        res.status(500).json({ error: 'Error creating user'});
    }
});

module.exports = router;