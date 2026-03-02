-- Improve full-text search for workouts by using the 'english' stemmer
-- This allows matching 'swim' with 'swimming', etc.

ALTER TABLE workouts DROP COLUMN IF EXISTS search_vector;

ALTER TABLE workouts ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title,'') || ' ' || coalesce(title_en,'') || ' ' || coalesce(category,'') || ' ' || coalesce(category_en,''))
  ) STORED;

-- Re-create the index
DROP INDEX IF EXISTS idx_workouts_search;
CREATE INDEX idx_workouts_search ON workouts USING GIN(search_vector);
