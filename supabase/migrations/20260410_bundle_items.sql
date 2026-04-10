-- Add bundle_items column to store individual items within a bundle
-- Format: [{name: "Blue onesie", emoji: "👕"}, {name: "Striped pants", emoji: "👖"}, ...]
ALTER TABLE items ADD COLUMN IF NOT EXISTS bundle_items jsonb;
