CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT,

    auth_provider VARCHAR(20) DEFAULT 'local',
    
    primary_currency VARCHAR(3) DEFAULT 'INR';
    currency_preference VARCHAR(3) DEFAULT 'USD',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

CREATE TABLE monthly_category_spend (
    user_id UUID NOT NULL,
    category_id UUID NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    base_spent NUMERIC DEFAULT 0,
    PRIMARY KEY (user_id, category_id, month, year),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE monthly_user_summary (
    user_id UUID NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    total_income NUMERIC DEFAULT 0,
    total_expense NUMERIC DEFAULT 0,
    PRIMARY KEY (user_id, month, year),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
