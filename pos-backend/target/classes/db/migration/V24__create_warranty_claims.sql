CREATE TABLE pos.warranty_claims (
    id BIGSERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    product_id BIGINT,
    product_name VARCHAR(255) NOT NULL,
    original_sale_id BIGINT,
    issue_description TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    resolution_type VARCHAR(30),
    resolution_notes TEXT,
    handled_by VARCHAR(100),
    claim_date TIMESTAMP NOT NULL DEFAULT NOW(),
    resolved_date TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);
