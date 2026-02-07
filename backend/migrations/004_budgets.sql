CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,
    category_id UUID NOT NULL,

    amount NUMERIC(14,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    base_amount NUMERIC(14,2),
    base_currency VARCHAR(3),
    exchange_rate NUMERIC(12,6),
    month INT NOT NULL,
    year INT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_budget_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_budget_category
        FOREIGN KEY(category_id)
        REFERENCES categories(id)
);
