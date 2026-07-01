BEGIN;

-- 1. Insert Vocation first (Parent table - 'code' removed to match your schema)
INSERT INTO vocation (id, name, faculty_id) VALUES 
    ('20000000-0000-0000-0000-000000000001', 'Прикладная математика и информатика', NULL)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Groups (Child of Vocation - wrapped in quotes)
INSERT INTO "group" (id, name, vocation_id, education_year, is_active) VALUES 
    ('30000000-0000-0000-0000-000000000001', 'ПМИ-2026', '20000000-0000-0000-0000-000000000001', 1, true),
    ('30000000-0000-0000-0000-000000000002', 'ПМИ-2025', '20000000-0000-0000-0000-000000000001', 2, true)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Subjects
INSERT INTO subject (id, name, semester, quantity_of_hours, credits_ects, form_of_control, is_active) VALUES 
    ('40000000-0000-0000-0000-000000000004', 'Теория графов', 5, 72, 2.0, 'Зачет', true),
    ('40000000-0000-0000-0000-000000000005', 'Основы кибернетики', 5, 72, 2.0, 'Зачет', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Persons
INSERT INTO person (id, full_name, email, phone) VALUES 
    ('60000000-0000-0000-0000-000000000005', 'Алиев Алишер', 'aliev.a@student.msu.tj', '+992000000003')
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Student Profile (Child of Person and Group)
INSERT INTO student_profile (person_id, group_id) VALUES 
    ('60000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000002')
ON CONFLICT (person_id) DO NOTHING;

COMMIT;
