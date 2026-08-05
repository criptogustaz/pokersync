ALTER TABLE drills
  ADD COLUMN IF NOT EXISTS solution text,
  ADD COLUMN IF NOT EXISTS format text,
  ADD COLUMN IF NOT EXISTS stack_bb int,
  ADD COLUMN IF NOT EXISTS position text,
  ADD COLUMN IF NOT EXISTS street text,
  ADD COLUMN IF NOT EXISTS action text;
