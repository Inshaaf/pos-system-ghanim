ALTER TABLE pos.shop_bill_activities
    ADD COLUMN confirmation_status VARCHAR(24) NOT NULL DEFAULT 'CONFIRMED',
    ADD COLUMN reviewed_by VARCHAR(100),
    ADD COLUMN reviewed_at TIMESTAMP,
    ADD COLUMN review_note TEXT;

ALTER TABLE pos.shop_bill_activities
    ADD CONSTRAINT chk_shop_bill_activity_confirmation_status
        CHECK (confirmation_status IN ('PENDING_CONFIRMATION', 'CONFIRMED', 'REJECTED'));
