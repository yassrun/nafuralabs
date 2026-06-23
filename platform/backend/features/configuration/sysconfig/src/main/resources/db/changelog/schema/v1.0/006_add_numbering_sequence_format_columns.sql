-- Add format and reset policy columns to numbering_sequences (for pattern and yearly/monthly reset)

ALTER TABLE numbering_sequences ADD COLUMN IF NOT EXISTS separator VARCHAR(5);
ALTER TABLE numbering_sequences ADD COLUMN IF NOT EXISTS reset_policy VARCHAR(20);
ALTER TABLE numbering_sequences ADD COLUMN IF NOT EXISTS year_format VARCHAR(10);
ALTER TABLE numbering_sequences ADD COLUMN IF NOT EXISTS last_reset_at TIMESTAMPTZ;
