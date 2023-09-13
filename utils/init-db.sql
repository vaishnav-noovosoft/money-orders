-- Create User Table
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL
);

-- Create Transaction Table
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id SERIAL PRIMARY KEY,
    "type" VARCHAR(255) NOT NULL,
    from_user INT REFERENCES user(user_id),
    to_user INT REFERENCES user(user_id),
    amount FLOAT,
    date_created TIMESTAMP DEFAULT NOW()
);

