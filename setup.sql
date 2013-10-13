BEGIN;

CREATE SCHEMA IF NOT EXISTS postorder;
CREATE TABLE IF NOT EXISTS postorder.work
(
  id serial,
  msg json NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT NOW(),
  CONSTRAINT "postorder.work.pk" PRIMARY KEY (id)
)
WITH ( OIDS = FALSE );
LOCK postorder.work IN EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION postorder.work_fn() RETURNS trigger AS $$
DECLARE
BEGIN
  NOTIFY postorder__work;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION postorder.work_fetch() RETURNS json AS $$
DECLARE
  work_id numeric;
  work_msg json;
BEGIN
  LOCK postorder.work IN EXCLUSIVE MODE;
  SELECT INTO work_id, work_msg id, msg FROM postorder.work ORDER BY id LIMIT 1;
  DELETE FROM postorder.work WHERE id = work_id;
  RETURN work_msg;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS postorder__work_notify ON postorder.work;
CREATE TRIGGER postorder__work_notify
  AFTER INSERT ON postorder.work
  EXECUTE PROCEDURE postorder.work_fn();

COMMIT;

