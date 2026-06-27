ALTER TABLE pos.purchase_needs
    ADD COLUMN store_status   VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    ADD COLUMN marked_available_by VARCHAR(255);
