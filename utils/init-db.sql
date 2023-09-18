-- Create User Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    balance FLOAT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS processes (
    id SERIAL PRIMARY KEY,
    status VARCHAR(255) DEFAULT 'PENDING',
    type VARCHAR(255) NOT NULL,

    -- Transactions
    transaction_type VARCHAR(255) DEFAULT NULL,
    transaction_from_user INT REFERENCES users(id) DEFAULT NULL,
    transaction_to_user INT REFERENCES users(id) DEFAULT NULL,
    transaction_amount FLOAT DEFAULT NULL,

    -- Emails
    email_receiver INT REFERENCES users(id) DEFAULT NULL,
    email_transaction_count INT DEFAULT NULL,

    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);