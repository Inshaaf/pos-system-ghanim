CREATE TABLE pos.stock_requests (
    id          BIGSERIAL PRIMARY KEY,
    product_id  BIGINT        NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    current_qty  NUMERIC(10,2) NOT NULL,
    requested_qty NUMERIC(10,2) NOT NULL,
    reason      VARCHAR(100)  NOT NULL,
    notes       VARCHAR(500),
    requested_by VARCHAR(100) NOT NULL,
    status      VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    review_note VARCHAR(500),
    reviewed_by VARCHAR(100),
    created_at  TIMESTAMP     NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMP
);
