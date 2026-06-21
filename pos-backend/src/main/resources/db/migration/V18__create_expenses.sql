ALTER TABLE pos.suppliers ADD COLUMN IF NOT EXISTS balance DECIMAL(12,2) NOT NULL DEFAULT 0;

CREATE TABLE pos.expenses (
    id         BIGSERIAL PRIMARY KEY,
    category   VARCHAR(30)    NOT NULL,
    amount     DECIMAL(12,2)  NOT NULL,
    note       TEXT,
    supplier_id    BIGINT REFERENCES pos.suppliers(id),
    salesperson_id BIGINT REFERENCES pos.salespersons(id),
    expense_date   DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at     TIMESTAMP NOT NULL DEFAULT NOW()
);
