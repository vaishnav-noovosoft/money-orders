const express = require("express");
const db = require("./db/postgres");

const app = express();
const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.get("/test2", (req, res) => {
    db.query('SELECT NOW() as current_time')
        .then((result) => {
            const currentTime = result.rows[0].current_time;
            res.send(`Current time from the database: ${currentTime}`);
        })
        .catch((err) => {
            console.error('Error executing query:', err);
            res.status(500).send('Error fetching current time from the database');
        })
});

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});