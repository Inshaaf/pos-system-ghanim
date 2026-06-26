CREATE TABLE pos.purchase_needs (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    quantity    NUMERIC(10,2),
    unit        VARCHAR(50),
    notes       TEXT,
    status      VARCHAR(20) NOT NULL DEFAULT 'NEEDED',
    supply_item_id  BIGINT REFERENCES pos.shop_supplies(id),
    requested_by    VARCHAR(100) NOT NULL,
    requested_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    resolved_by     VARCHAR(100),
    resolved_at     TIMESTAMP
);

CREATE INDEX idx_purchase_needs_status ON pos.purchase_needs(status);
CREATE INDEX idx_purchase_needs_name   ON pos.purchase_needs(lower(name));
