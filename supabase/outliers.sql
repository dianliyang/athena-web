-- Outlier data for testing layouts

INSERT INTO courses (university, course_code, title, units, credit, description, department, level, difficulty, popularity) VALUES
  ('SUPER_LONG_UNIVERSITY_NAME_THAT_MIGHT_OVERFLOW_THE_LAYOUT_COMPLETELY_IF_NOT_HANDLED_CORRECTLY', 'VERY-LONG-COURSE-CODE-1234567890-ABCDEFGHIJ', 'The Structure and Interpretation of Extremely Complex and Highly Distributed Computer Programs in the Modern Era of Artificial Intelligence and Quantum Computing', '99-99-99', 999, 'An extremely long description that goes on and on to test how the UI handles massive amounts of text in the course details section. This should probably be truncated or scrollable in most views to prevent breaking the overall user experience and layout integrity.', 'Department of Advanced Theoretical and Applied Computational Sciences and Engineering Physics', 'Post-Doctoral ultra-research', 10, 9999)
ON CONFLICT (university, course_code) DO NOTHING;

INSERT INTO fields (name) VALUES
  ('Super Extremely Long Field Name for Testing Overflows in Learning Identity Chart and Filters')
ON CONFLICT (name) DO NOTHING;

INSERT INTO workouts (source, course_code, category, category_en, title, title_en, day_of_week, start_time, end_time, location, location_en, price_student, price_staff, booking_status) VALUES
  ('CAU Kiel Sportzentrum', 'OUTLIER-01', 'Extreme Multi-Level Yoga and Advanced Physical Meditation for High Performance Athletes', 'Extreme Multi-Level Yoga', 'Advanced Physical Meditation for High Performance Athletes with Special Focus on Breathing and Mental Clarity', 'Advanced Physical Meditation', 'Mon, Tue, Wed, Thu, Fri, Sat, Sun', '00:00:00', '23:59:59', 'The Very Large Hall in the Basement of the Old Building near the North Entrance', 'Very Large Hall', 999.99, 1999.99, 'available')
ON CONFLICT DO NOTHING;

-- Study logs with long notes
-- First find a plan
DO $$
DECLARE
  v_user_id uuid;
  v_plan_id integer;
BEGIN
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  SELECT id INTO v_plan_id FROM study_plans WHERE user_id = v_user_id LIMIT 1;
  
  IF v_plan_id IS NOT NULL THEN
    INSERT INTO study_logs (user_id, plan_id, log_date, is_completed, notes)
    VALUES (v_user_id, v_plan_id, CURRENT_DATE - 1, true, 'This is an extremely long note to test how the UI handles long text in the study log section. It should probably be truncated or wrapped correctly so it does not overflow the container and push other elements out of the way. We need to make sure that the layout remains responsive and readable even with such long inputs from the users or automated systems.')
    ON CONFLICT (plan_id, log_date) DO UPDATE SET notes = EXCLUDED.notes;
  END IF;
END $$;
