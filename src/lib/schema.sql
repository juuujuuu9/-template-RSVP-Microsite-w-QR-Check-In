-- Run this in Neon SQL Editor or via migration to create the entries table.
-- Table: entries (RSVP form submissions)

CREATE TABLE IF NOT EXISTS entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  terms_accepted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  hub_entry_id TEXT,
  source_data JSONB
);

CREATE INDEX IF NOT EXISTS idx_entries_email ON entries (email);
CREATE INDEX IF NOT EXISTS idx_entries_created_at ON entries (created_at DESC);
