-- INTENSIVE MOCK DATA FOR TODAY
-- This script populates all major tables with dense data for layout testing.

DO $$
DECLARE
  v_user_id uuid;
  v_course_id_mit bigint;
  v_course_id_stan bigint;
  v_course_id_berk bigint;
  v_course_id_cmu bigint;
  v_course_id_extra1 bigint;
  v_course_id_extra2 bigint;
  v_today date := CURRENT_DATE;
  v_now timestamp := CURRENT_TIMESTAMP;
BEGIN
  -- 1. Get primary user
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'No user found. Please sign up in the UI first.';
    RETURN;
  END IF;

  -- 2. DENSE COURSES
  INSERT INTO courses (university, course_code, title, units, credit, department, level, difficulty, popularity)
  VALUES 
    ('MIT', '6.1010', 'Software Performance Engineering', '4-0-8', 12, 'EECS', 'Undergraduate', 4.5, 850),
    ('Stanford', 'CS107', 'Computer Systems', '5', 5, 'CS', 'Undergraduate', 4.2, 1200),
    ('UC Berkeley', 'CS162', 'Operating Systems', '4', 4, 'EECS', 'Undergraduate', 4.8, 950),
    ('CMU', '15-445', 'Database Systems', '12', 12, 'CS', 'Undergraduate', 4.6, 1100),
    ('MIT', '18.06', 'Linear Algebra', '4-0-8', 12, 'MATH', 'Undergraduate', 3.8, 2500),
    ('Stanford', 'CS224N', 'NLP with Deep Learning', '4', 4, 'CS', 'Graduate', 4.7, 1800),
    ('UC Berkeley', 'CS188', 'Artificial Intelligence', '4', 4, 'EECS', 'Undergraduate', 4.0, 1400),
    ('CMU', '15-213', 'Introduction to Computer Systems', '12', 12, 'CS', 'Undergraduate', 4.4, 2000)
  ON CONFLICT (university, course_code) DO UPDATE SET popularity = courses.popularity + 10;

  SELECT id INTO v_course_id_mit FROM courses WHERE course_code = '6.1010' AND university = 'MIT' LIMIT 1;
  SELECT id INTO v_course_id_stan FROM courses WHERE course_code = 'CS107' AND university = 'Stanford' LIMIT 1;
  SELECT id INTO v_course_id_berk FROM courses WHERE course_code = 'CS162' AND university = 'UC Berkeley' LIMIT 1;
  SELECT id INTO v_course_id_cmu FROM courses WHERE course_code = '15-445' AND university = 'CMU' LIMIT 1;
  SELECT id INTO v_course_id_extra1 FROM courses WHERE course_code = 'CS224N' AND university = 'Stanford' LIMIT 1;
  SELECT id INTO v_course_id_extra2 FROM courses WHERE course_code = '18.06' AND university = 'MIT' LIMIT 1;

  -- 3. USER ENROLLMENTS (DENSE)
  INSERT INTO user_courses (user_id, course_id, status, progress, updated_at)
  VALUES 
    (v_user_id, v_course_id_mit, 'in_progress', 15, v_now),
    (v_user_id, v_course_id_stan, 'in_progress', 30, v_now),
    (v_user_id, v_course_id_berk, 'in_progress', 45, v_now),
    (v_user_id, v_course_id_cmu, 'in_progress', 10, v_now),
    (v_user_id, v_course_id_extra1, 'in_progress', 5, v_now),
    (v_user_id, v_course_id_extra2, 'completed', 100, v_now - interval '2 days')
  ON CONFLICT (user_id, course_id) DO UPDATE SET updated_at = EXCLUDED.updated_at;

  -- 4. FIELDS & CATEGORIES
  INSERT INTO fields (name) VALUES ('Systems'), ('AI'), ('Theory'), ('Mathematics'), ('Applications') ON CONFLICT DO NOTHING;
  
  INSERT INTO course_fields (course_id, field_id)
  SELECT v_course_id_mit, id FROM fields WHERE name = 'Systems' ON CONFLICT DO NOTHING;
  INSERT INTO course_fields (course_id, field_id)
  SELECT v_course_id_extra1, id FROM fields WHERE name = 'AI' ON CONFLICT DO NOTHING;

  -- 5. RECURRING STUDY PLANS (TODAY)
  INSERT INTO study_plans (user_id, course_id, start_date, end_date, days_of_week, start_time, end_time, kind, location)
  VALUES 
    (v_user_id, v_course_id_mit, v_today - 14, v_today + 60, ARRAY[EXTRACT(DOW FROM v_today)::int], '19:00', '21:00', 'Lecture', 'Stata Center'),
    (v_user_id, v_course_id_stan, v_today - 14, v_today + 60, ARRAY[EXTRACT(DOW FROM v_today)::int], '14:00', '15:30', 'Seminar', 'Gates B01'),
    (v_user_id, v_course_id_extra2, v_today - 14, v_today + 60, ARRAY[EXTRACT(DOW FROM v_today)::int], '10:00', '11:30', 'Review', 'Online')
  ON CONFLICT DO NOTHING;

  -- 6. SPECIFIC TASKS (Override plans for Today)
  INSERT INTO course_schedules (course_id, schedule_date, task_title, task_kind, duration_minutes, source)
  VALUES
    (v_course_id_berk, v_today, 'Read: Operating Systems Three Easy Pieces (Chap 1-4)', 'reading', 120, 'manual'),
    (v_course_id_berk, v_today, 'Lab 1: Booting an OS', 'lab', 180, 'manual'),
    (v_course_id_cmu, v_today, 'Project 1: Buffer Pool Manager Implementation', 'project', 240, 'manual'),
    (v_course_id_extra1, v_today, 'Watch: Transformer Architecture Lecture', 'video', 90, 'manual')
  ON CONFLICT DO NOTHING;

  -- 7. ASSIGNMENTS DUE TODAY
  INSERT INTO course_assignments (course_id, label, kind, due_on, description, url)
  VALUES
    (v_course_id_mit, 'Quiz 1: Memory Hierarchy', 'exam', v_today, 'Covers first 3 weeks', 'https://mit.edu'),
    (v_course_id_stan, 'Assignment 2: Binary Bomb', 'assignment', v_today, 'Strict deadline at 23:59', NULL),
    (v_course_id_cmu, 'Midterm Review Sheet', 'assignment', v_today, 'Optional but recommended', NULL)
  ON CONFLICT DO NOTHING;

  -- 8. WORKOUTS (DENSE)
  INSERT INTO workouts (source, course_code, category, title, day_of_week, start_time, end_time, location, start_date, end_date, booking_status)
  VALUES
    ('Sport Center', 'W-HIIT', 'Fitness', 'High Intensity Training', 
     (ARRAY['Sun','Mon','Tue','Wed','Thu','Fri','Sat'])[EXTRACT(DOW FROM v_today)::int + 1], '07:00', '08:00', 'Gym Floor', v_today - 30, v_today + 30, 'available'),
    ('Sport Center', 'W-YOGA', 'Wellness', 'Sunrise Vinyasa Flow',
     (ARRAY['Sun','Mon','Tue','Wed','Thu','Fri','Sat'])[EXTRACT(DOW FROM v_today)::int + 1], '08:15', '09:30', 'Studio A', v_today - 30, v_today + 30, 'available'),
    ('Sport Center', 'W-SWIM', 'Aquatics', 'Advanced Lap Swimming',
     (ARRAY['Sun','Mon','Tue','Wed','Thu','Fri','Sat'])[EXTRACT(DOW FROM v_today)::int + 1], '12:00', '13:30', 'Pool', v_today - 30, v_today + 30, 'available'),
    ('Sport Center', 'W-BOX', 'Combat', 'Technical Boxing',
     (ARRAY['Sun','Mon','Tue','Wed','Thu','Fri','Sat'])[EXTRACT(DOW FROM v_today)::int + 1], '17:30', '19:00', 'Combat Room', v_today - 30, v_today + 30, 'available')
  ON CONFLICT (source, course_code) DO NOTHING;

  INSERT INTO user_workouts (user_id, workout_id)
  SELECT v_user_id, id FROM workouts WHERE course_code LIKE 'W-%' ON CONFLICT DO NOTHING;

  -- 9. SCRAPER RUNS (DENSE)
  INSERT INTO scraper_jobs (university, semester, status, job_type, triggered_by, course_count, duration_ms, created_at)
  VALUES
    ('MIT', 'Fall 2025', 'completed', 'courses', 'manual', 1450, 45200, v_now - interval '1 hour'),
    ('Stanford', 'Winter 2026', 'failed', 'courses', 'manual', 0, 12000, v_now - interval '2 hours'),
    ('UC Berkeley', 'Spring 2026', 'running', 'courses', 'manual', 420, 35000, v_now - interval '5 minutes'),
    ('CMU', 'Fall 2025', 'completed', 'courses', 'cron', 890, 28000, v_now - interval '4 hours'),
    ('ETH Zurich', 'Fall 2025', 'completed', 'courses', 'manual', 600, 15000, v_now - interval '6 hours')
  ON CONFLICT DO NOTHING;

  -- 10. AI USAGE (DENSE)
  INSERT INTO ai_responses (user_id, feature, model, response_payload, cost_usd, tokens_input, tokens_output, created_at)
  VALUES
    (v_user_id, 'course-intel', 'gpt-4o', '{"status": "ok"}'::jsonb, 0.015, 2500, 1200, v_today),
    (v_user_id, 'planner', 'claude-3-5-sonnet', '{"status": "ok"}'::jsonb, 0.022, 4500, 2800, v_today),
    (v_user_id, 'syllabus-retrieve', 'gemini-1.5-pro', '{"status": "ok"}'::jsonb, 0.005, 1200, 400, v_today),
    (v_user_id, 'course-intel', 'gpt-4o', '{"status": "ok"}'::jsonb, 0.012, 2000, 1000, v_today - 1),
    (v_user_id, 'planner', 'gpt-4o', '{"status": "ok"}'::jsonb, 0.018, 3000, 1500, v_today - 2),
    (v_user_id, 'course-intel', 'gpt-4o', '{"status": "ok"}'::jsonb, 0.010, 1500, 800, v_today - 3)
  ON CONFLICT DO NOTHING;

  -- 11. PROJECTS & SEMINARS
  INSERT INTO projects_seminars (university, course_code, title, category, department, latest_semester)
  VALUES
    ('MIT', 'PS-99', 'High-Performance Distributed Cache Research', 'Research', 'EECS', '{"term": "Fall", "year": 2025}'),
    ('Stanford', 'PS-101', 'Autonomous Drone Navigation Systems', 'Project', 'CS', '{"term": "Winter", "year": 2026}'),
    ('UC Berkeley', 'SEM-202', 'Modern Philosophy in the Digital Age', 'Seminar', 'Philosophy', '{"term": "Spring", "year": 2026}')
  ON CONFLICT DO NOTHING;

END $$;
