CREATE TABLE pos.sale_cancellation_requests (
    id BIGSERIAL PRIMARY KEY,
    sale_type VARCHAR(20) NOT NULL CHECK (sale_type IN ('SALE', 'QUICK_SALE')),
    sale_id BIGINT NOT NULL,
    reason TEXT NOT NULL,
    requested_by VARCHAR(100) NOT NULL,
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    reviewed_by VARCHAR(100),
    reviewed_at TIMESTAMP
);

CREATE UNIQUE INDEX uq_pending_sale_cancellation_request
    ON pos.sale_cancellation_requests (sale_type, sale_id)
    WHERE status = 'PENDING';

CREATE INDEX idx_sale_cancellation_requests_status_requested_at
    ON pos.sale_cancellation_requests (status, requested_at DESC);
