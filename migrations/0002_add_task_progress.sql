-- Migration number: 0002 	 2026-07-16T06:41:51.758Z

ALTER TABLE "Tasks" ADD COLUMN "progress" TEXT NOT NULL DEFAULT '0';

-- Backfill: tasks already marked done were 100% complete under the old
-- done/total rollup, so treat them as 100% under the new per-task metric too.
UPDATE "Tasks" SET "progress" = '100' WHERE "status" = 'done';
