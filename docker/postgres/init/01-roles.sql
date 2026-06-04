-- Runs once when the Postgres data volume is first created (docker-entrypoint-initdb.d).
-- Idempotent: safe if the role already exists from a previous init or migration.
--
-- Table grants, schemas, and RLS policies still require: pnpm db:migrate
-- (see packages/db/drizzle/0002_propai_app_role.sql and later migrations).

DO $$ BEGIN
  CREATE ROLE propai_app LOGIN PASSWORD 'propai_app';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
