-- Create User Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    balance FLOAT DEFAULT 0
);

-- Create Transaction Table
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    "type" VARCHAR(255) NOT NULL,
    from_user INT REFERENCES users(id),
    to_user INT REFERENCES users(id),
    amount FLOAT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create Email Table
CREATE TABLE IF NOT EXISTS emails (
    id SERIAL PRIMARY KEY,
    receiver INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS processes (
    id SERIAL PRIMARY KEY,
    transaction_id INT REFERENCES transactions(id),
    email_id INT REFERENCES emails(id),
    status VARCHAR(255) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);