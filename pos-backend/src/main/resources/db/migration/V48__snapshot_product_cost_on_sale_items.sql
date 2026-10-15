ALTER TABLE pos.sale_items
    ADD COLUMN cost_price_snapshot DECIMAL(10,2);

ALTER TABLE pos.quick_sale_items
    ADD COLUMN cost_price_snapshot DECIMAL(10,2);

ALTER TABLE pos.return_items
    ADD COLUMN cost_price_snapshot DECIMAL(10,2);

-- Preserve the best available cost for transactions recorded before snapshots existed.
UPDATE pos.sale_items si
SET cost_price_snapshot = p.cost_price
FROM public.products p
WHERE si.product_id = p.id;

UPDATE pos.quick_sale_items qi
SET cost_price_snapshot = p.cost_price
FROM public.products p
WHERE qi.product_id = p.id;

UPDATE pos.return_items ri
SET cost_price_snapshot = p.cost_price
FROM public.products p
WHERE ri.product_id = p.id;
