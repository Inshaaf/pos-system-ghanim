CREATE TABLE pos.shop_supplies (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(200) NOT NULL,
    unit       VARCHAR(50)  NOT NULL DEFAULT 'piece',
    category   VARCHAR(100),
    active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);
