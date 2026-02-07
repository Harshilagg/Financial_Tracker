CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,
    category_id UUID,

    type VARCHAR(10)
        CHECK (type IN ('income','expense')),

    amount NUMERIC(14,2) NOT NULL,

    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    base_amount NUMERIC(14,2),
    base_currency VARCHAR(3) DEFAULT 'INR',
    exchange_rate NUMERIC(12,6),
    description TEXT,

    transaction_date DATE NOT NULL,

    is_refund BOOLEAN DEFAULT FALSE,

    receipt_url TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_transaction_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_transaction_category
        FOREIGN KEY(category_id)
        REFERENCES categories(id)
);
