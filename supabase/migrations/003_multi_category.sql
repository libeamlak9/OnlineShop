-- 003_multi_category.sql
-- Products can belong to multiple categories.

alter table products add column categories text[] not null default '{}';

-- Backfill from the old single-category column.
update products set categories = array[category] where category is not null and category <> '';

alter table products drop column category;
