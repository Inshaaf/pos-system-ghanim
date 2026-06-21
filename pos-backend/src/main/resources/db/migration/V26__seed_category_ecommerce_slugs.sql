UPDATE public.categories SET ecommerce_slug = 'kitchenware' WHERE LOWER(name) LIKE '%kitchen%';
UPDATE public.categories SET ecommerce_slug = 'aluminium'   WHERE LOWER(name) LIKE '%alumin%';
UPDATE public.categories SET ecommerce_slug = 'plastic'     WHERE LOWER(name) LIKE '%plastic%';
UPDATE public.categories SET ecommerce_slug = 'gift-items'  WHERE LOWER(name) LIKE '%gift%';
UPDATE public.categories SET ecommerce_slug = 'umbrellas'   WHERE LOWER(name) LIKE '%umbrella%';
UPDATE public.categories SET ecommerce_slug = 'lighting'    WHERE LOWER(name) LIKE '%light%';
UPDATE public.categories SET ecommerce_slug = 'general'     WHERE LOWER(name) LIKE '%general%';
