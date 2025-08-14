-- Add shopify_variant_id to products table
ALTER TABLE products ADD COLUMN shopify_variant_id VARCHAR(50);

-- Add coupon_code and discount_percentage to answer_key table  
ALTER TABLE answer_key ADD COLUMN coupon_code VARCHAR(50);
ALTER TABLE answer_key ADD COLUMN discount_percentage INTEGER;
