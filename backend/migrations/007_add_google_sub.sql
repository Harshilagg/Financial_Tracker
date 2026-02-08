ALTER TABLE users
  ADD COLUMN IF NOT EXISTS google_sub TEXT;

ALTER TABLE users
  ALTER COLUMN auth_provider SET DEFAULT 'local';
