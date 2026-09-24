CREATE INDEX IF NOT EXISTS idx_idempotency_expires_at
    ON idempotency_keys(expires_at);
CREATE INDEX IF NOT EXISTS idx_idempotency_user_created
    ON idempotency_keys(user_id, created_at);

ALTER TABLE idempotency_keys
    ADD COLUMN IF NOT EXISTS endpoint VARCHAR(255);

UPDATE idempotency_keys
SET endpoint = COALESCE(endpoint, 'legacy')
WHERE endpoint IS NULL;

ALTER TABLE idempotency_keys
    ALTER COLUMN endpoint SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'idempotency_request_hash_not_blank'
    ) THEN
        ALTER TABLE idempotency_keys
            ADD CONSTRAINT idempotency_request_hash_not_blank
            CHECK (length(trim(request_hash)) > 0);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_journal_line_not_both'
    ) THEN
        ALTER TABLE journal_lines
            ADD CONSTRAINT chk_journal_line_not_both
            CHECK (NOT (debit > 0 AND credit > 0));
    END IF;
END $$;
