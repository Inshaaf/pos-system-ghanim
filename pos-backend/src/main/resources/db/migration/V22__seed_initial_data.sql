-- Salespersons
INSERT INTO pos.salespersons (name)
SELECT name FROM (VALUES ('Rishad'), ('Sulochana'), ('Malkanthi')) AS v(name)
WHERE NOT EXISTS (
    SELECT 1 FROM pos.salespersons s WHERE LOWER(s.name) = LOWER(v.name)
);

-- Day Salary Workers
INSERT INTO pos.temp_workers (name)
SELECT name FROM (VALUES ('Rishad')) AS v(name)
WHERE NOT EXISTS (
    SELECT 1 FROM pos.temp_workers t WHERE LOWER(t.name) = LOWER(v.name)
);

-- Supplier: General Stock (already in V2 but guard in case of fresh installs with schema drift)
INSERT INTO pos.suppliers (name)
SELECT 'General Stock'
WHERE NOT EXISTS (
    SELECT 1 FROM pos.suppliers WHERE LOWER(name) = 'general stock'
);

-- Categories (already in V3 but guard for completeness)
INSERT INTO public.categories (name)
SELECT name FROM (VALUES
    ('Plastic'), ('Electronic'), ('Gift Items'), ('Umbrella'),
    ('Net'), ('Aluminium'), ('Lighting'), ('Kitchenware'), ('General')
) AS v(name)
WHERE NOT EXISTS (
    SELECT 1 FROM public.categories c WHERE LOWER(c.name) = LOWER(v.name)
);
