-- Split academic_performance into separate exam and zachet tables
-- This migration creates the new tables and migrates existing data

-- Create exam table (signs 1-5, passing grade ≥ 3)
CREATE TABLE IF NOT EXISTS exam (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    student_id UUID NOT NULL,
    discipline_id UUID NOT NULL,
    teacher_id UUID NOT NULL,
    tour INT NOT NULL DEFAULT 1,
    sign INT NOT NULL CHECK (sign >= 1 AND sign <= 5),
    CONSTRAINT fk_exam_student FOREIGN KEY (student_id) REFERENCES person(id) ON DELETE CASCADE,
    CONSTRAINT fk_exam_discipline FOREIGN KEY (discipline_id) REFERENCES discipline(id) ON DELETE CASCADE,
    CONSTRAINT fk_exam_teacher FOREIGN KEY (teacher_id) REFERENCES person(id) ON DELETE RESTRICT
);

-- Create zachet table (signs 0-3, passing grade ≥ 1)
CREATE TABLE IF NOT EXISTS zachet (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    student_id UUID NOT NULL,
    discipline_id UUID NOT NULL,
    teacher_id UUID NOT NULL,
    tour INT NOT NULL DEFAULT 1,
    sign INT NOT NULL CHECK (sign >= 0 AND sign <= 3),
    CONSTRAINT fk_zachet_student FOREIGN KEY (student_id) REFERENCES person(id) ON DELETE CASCADE,
    CONSTRAINT fk_zachet_discipline FOREIGN KEY (discipline_id) REFERENCES discipline(id) ON DELETE CASCADE,
    CONSTRAINT fk_zachet_teacher FOREIGN KEY (teacher_id) REFERENCES person(id) ON DELETE RESTRICT
);

-- Migrate existing exam records (form_of_control = 'exam') to exam table
INSERT INTO exam (id, created_at, updated_at, is_active, student_id, discipline_id, teacher_id, tour, sign)
SELECT id, created_at, updated_at, is_active, student_id, discipline_id, teacher_id, tour, sign
FROM academic_performance
WHERE form_of_control = 'exam'
ON CONFLICT (id) DO NOTHING;

-- Migrate existing test records (form_of_control = 'test') to zachet table
INSERT INTO zachet (id, created_at, updated_at, is_active, student_id, discipline_id, teacher_id, tour, sign)
SELECT id, created_at, updated_at, is_active, student_id, discipline_id, teacher_id, tour, sign
FROM academic_performance
WHERE form_of_control = 'test'
ON CONFLICT (id) DO NOTHING;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_exam_student ON exam(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_discipline ON exam(discipline_id);
CREATE INDEX IF NOT EXISTS idx_zachet_student ON zachet(student_id);
CREATE INDEX IF NOT EXISTS idx_zachet_discipline ON zachet(discipline_id);