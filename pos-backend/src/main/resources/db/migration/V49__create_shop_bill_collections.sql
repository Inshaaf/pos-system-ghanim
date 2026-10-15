ALTER TABLE pos.salespersons
    ADD COLUMN active_for_collection BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE pos.shop_bills (
    id BIGSERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    bill_number VARCHAR(120) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('RAINCO', 'PLASTIC')),
    bill_type VARCHAR(20) NOT NULL CHECK (bill_type IN ('CASH', 'CREDIT')),
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0 AND paid_amount <= amount),
    status VARCHAR(24) NOT NULL DEFAULT 'PENDING_APPROVAL'
        CHECK (status IN ('PENDING_APPROVAL', 'OPEN', 'COMPLETED', 'REJECTED')),
    requested_by VARCHAR(100) NOT NULL,
    reviewed_by VARCHAR(100),
    salesperson_id BIGINT REFERENCES pos.salespersons(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP
);

CREATE INDEX idx_shop_bills_status_created ON pos.shop_bills(status, created_at DESC);
CREATE INDEX idx_shop_bills_customer ON pos.shop_bills(customer_name);
CREATE INDEX idx_shop_bills_number ON pos.shop_bills(bill_number);

CREATE TABLE pos.shop_bill_activities (
    id BIGSERIAL PRIMARY KEY,
    bill_id BIGINT NOT NULL REFERENCES pos.shop_bills(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('PAYMENT', 'FOLLOW_UP')),
    amount NUMERIC(12,2),
    payment_method VARCHAR(20) CHECK (payment_method IN ('CASH', 'CHEQUE')),
    reason TEXT,
    follow_up_at TIMESTAMP,
    recorded_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK ((type = 'PAYMENT' AND amount > 0 AND payment_method IS NOT NULL)
        OR (type = 'FOLLOW_UP' AND reason IS NOT NULL))
);

CREATE INDEX idx_shop_bill_activities_bill_created ON pos.shop_bill_activities(bill_id, created_at DESC);
