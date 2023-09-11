-- Create User Table
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- Create Admin Table
CREATE TABLE IF NOT EXISTS admin (
    admin_id SERIAL PRIMARY KEY,
    user_id INT
);

-- Create Transaction Table
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id SERIAL PRIMARY KEY,
    "type" VARCHAR(255) NOT NULL,
    from_user INT,
    to_user INT,
    amount FLOAT,
    date_created TIMESTAMP DEFAULT NOW()
);
