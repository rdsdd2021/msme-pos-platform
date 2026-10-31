-- Initial PostgreSQL setup for MSME POS Platform
-- Extensions required by the application
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Confirm setup
DO $$
BEGIN
  RAISE NOTICE 'MSME POS Platform PostgreSQL initialized successfully';
END $$;
