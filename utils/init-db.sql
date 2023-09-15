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
    status VARCHAR(255) DEFAULT 'pending',
    date_created TIMESTAMP DEFAULT NOW()
);

-- Create Email Table
CREATE TABLE IF NOT EXISTS emails (
    id SERIAL PRIMARY KEY,
    sender INT REFERENCES users(id),
    receiver INT REFERENCES users(id),
    status VARCHAR(255) DEFAULT 'pending',
    emailHTML TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
