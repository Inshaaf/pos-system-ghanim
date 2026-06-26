CREATE TABLE pos.app_settings (
    setting_key   VARCHAR(50)  PRIMARY KEY,
    setting_value TEXT
);

-- Dummy cipher — owner must update this after first login via Settings page
-- Real mapping: go to Settings > Shop Code Cipher and enter your 10-letter key
INSERT INTO pos.app_settings (setting_key, setting_value)
VALUES ('shop_code_cipher', 'AAAAAAAAAA');
