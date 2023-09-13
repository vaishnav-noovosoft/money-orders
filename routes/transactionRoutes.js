const express = require('express');
const db = require("../db/postgres");
const router = express.Router();
const jwt = require('jsonwebtoken');

const verifyType = async (req,res,next)=>{
    try {
        const authHeader = req.header.authorization;
        const [bearer, token] = authHeader.split(' ');
        if (bearer !== 'Bearer' && !token) {
            return res.status(401).json({error: 'Invalid Authorization'})
        }
        const user = await jwt.verify(token);
        if(!user){
            return res.status(404).json({error: 'User not found'});
        }
        const {type} = req.body.role;
        if (type === 'user' || type === 'admin') {
            next();
        } else {
            return res.status(400).json({error: 'Required Type not Present'})
        }
    }
    catch(err){
        console.log('Error checking username Type', err);
        res.status(500).json({ error: 'Server error'});
    }




}

router.post('?type=deposit',verifyType, async (req, res) => {

    try{
        const {toUserName, amount}  = req.body;
        const query = 'SELECT * FROM users WHERE username = $1';
        const values = [toUserName];
        const result = await db.query(query, values);
        if(result.rows.length===0){
            return res.status(404).json({ error: 'User not found' });

        }
        const userId = result.rows.user_id;
        await db.query(`INSERT into transaction (type,to_user,amount,date_created) values ($1,$2,$3,$4)`,['deposit',userId,amount,new Date().getDate()])
        res.send('Money Deposited Successful');

    }catch (err){
        res.status(500).send(err.message);
    }
})
router.post('?type=withdraw',verifyType,async (req,res)=>{
    try {
        const {fromUserName, amount} = req.body;
        const query = 'SELECT * FROM users where username=$1';
        const values = [fromUserName];
        const result = db.query(query, values);
        if (result.rows.length === 0) {
            return res.status(404).json({error: 'User not found'});
        }money_orders_db
        const userID = result.rows.user_id;
        await db.query(`INSERT into transaction (type, from_user, amount, date_created)
                        values ($1, $2, $3, $4)`, ['withdraw', userID, amount, new Date().getDate()]);
        res.send('Money Withdraw Sucessfully');
    }
    catch (err){
        res.status(500).send(err.message);


    }
})
module.exports = router;

