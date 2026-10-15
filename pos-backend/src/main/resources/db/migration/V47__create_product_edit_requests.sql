CREATE TABLE pos.product_edit_requests (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    current_data TEXT NOT NULL,
    proposed_data TEXT NOT NULL,
    requested_by VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    reviewed_by VARCHAR(100),
    review_note TEXT,
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP
);

CREATE INDEX idx_product_edit_requests_status_requested_at
    ON pos.product_edit_requests (status, requested_at DESC);

CREATE UNIQUE INDEX uq_pending_product_edit_request
    ON pos.product_edit_requests (product_id)
    WHERE status = 'PENDING';
