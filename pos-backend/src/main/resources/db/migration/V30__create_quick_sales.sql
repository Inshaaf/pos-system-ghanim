CREATE TABLE pos.quick_sales (
    id              BIGSERIAL PRIMARY KEY,
    salesperson_id  BIGINT NOT NULL REFERENCES pos.salespersons(id),
    total           DECIMAL(10,2) NOT NULL,
    payment_method  VARCHAR(20) NOT NULL DEFAULT 'CASH',
    cash_tendered   DECIMAL(10,2),
    change_amount   DECIMAL(10,2),
    notes           VARCHAR(500),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pos.quick_sale_items (
    id              BIGSERIAL PRIMARY KEY,
    quick_sale_id   BIGINT NOT NULL REFERENCES pos.quick_sales(id),
    product_id      BIGINT REFERENCES public.products(id),
    name            VARCHAR(255) NOT NULL,
    quantity        DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price      DECIMAL(10,2) NOT NULL,
    subtotal        DECIMAL(10,2) NOT NULL
);
