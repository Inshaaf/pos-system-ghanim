CREATE TABLE pos.supplier_deliveries (
    id             BIGSERIAL PRIMARY KEY,
    supplier_id    BIGINT         NOT NULL REFERENCES pos.suppliers(id),
    supply_item_id BIGINT         REFERENCES pos.shop_supplies(id),
    quantity       NUMERIC(12, 3) NOT NULL,
    unit_price     NUMERIC(12, 2) NOT NULL,
    amount         NUMERIC(12, 2) NOT NULL,
    note           TEXT,
    delivered_at   DATE           NOT NULL DEFAULT CURRENT_DATE,
    created_by     VARCHAR(100),
    created_at     TIMESTAMP      NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_supplier_deliveries_supplier ON pos.supplier_deliveries(supplier_id);
CREATE INDEX idx_supplier_deliveries_date     ON pos.supplier_deliveries(delivered_at);
