-- Create extension for UUID generation if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum types
DO $$ BEGIN
    CREATE TYPE auditorium_type AS ENUM ('lecture', 'practice', 'flow');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE lesson_type AS ENUM ('lecture', 'practice', 'lab');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Base tables
CREATE TABLE IF NOT EXISTS faculty (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    name VARCHAR(150) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS vocation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    name VARCHAR(150) NOT NULL UNIQUE,
    faculty_id UUID,
    CONSTRAINT fk_vocation_faculty FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "group" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    name VARCHAR(50) NOT NULL UNIQUE,
    vocation_id UUID NOT NULL,
    education_year INT NOT NULL,
    CONSTRAINT fk_group_vocation FOREIGN KEY (vocation_id) REFERENCES vocation(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS auditorium (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    number VARCHAR(20) NOT NULL UNIQUE,
    type auditorium_type NOT NULL
);

CREATE TABLE IF NOT EXISTS role (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS person (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    full_name VARCHAR(150) NOT NULL,
    date_of_birth TIMESTAMP,
    phone VARCHAR(20),
    address TEXT,
    email VARCHAR(100) UNIQUE
);

CREATE TABLE IF NOT EXISTS staff_profile (
    person_id UUID PRIMARY KEY,
    science_degree VARCHAR(100),
    science_rank VARCHAR(100),
    occupation VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT fk_staff_person FOREIGN KEY (person_id) REFERENCES person(id)
);

CREATE TABLE IF NOT EXISTS student_profile (
    person_id UUID PRIMARY KEY,
    group_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT fk_student_person FOREIGN KEY (person_id) REFERENCES person(id) ON DELETE CASCADE,
    CONSTRAINT fk_student_group FOREIGN KEY (group_id) REFERENCES "group"(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS subject (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    name VARCHAR(150) NOT NULL UNIQUE,
    semester INT NOT NULL,
    quantity_of_hours INT NOT NULL,
    credits_ects DECIMAL(4,1) NOT NULL DEFAULT 0,
    form_of_control VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS discipline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    subject_id UUID NOT NULL,
    teacher_id UUID NOT NULL,
    group_id UUID NOT NULL,
    quantity_of_lectures INT NOT NULL DEFAULT 0,
    quantity_of_practical_lessons INT NOT NULL DEFAULT 0,
    quantity_of_lab_works INT NOT NULL DEFAULT 0,
    other_works INT NOT NULL DEFAULT 0,
    self_control INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_discipline_subject FOREIGN KEY (subject_id) REFERENCES subject(id) ON DELETE CASCADE,
    CONSTRAINT fk_discipline_teacher FOREIGN KEY (teacher_id) REFERENCES person(id) ON DELETE RESTRICT,
    CONSTRAINT fk_discipline_group FOREIGN KEY (group_id) REFERENCES "group"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS week (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    name VARCHAR(100) NOT NULL,
    date_of_start TIMESTAMP NOT NULL,
    date_of_ending TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    day TIMESTAMP NOT NULL,
    pair INT NOT NULL,
    subject_id UUID NOT NULL,
    teacher_id UUID NOT NULL,
    type_of_lesson lesson_type NOT NULL,
    auditorium_id UUID,
    group_id UUID NOT NULL,
    CONSTRAINT fk_schedule_subject FOREIGN KEY (subject_id) REFERENCES subject(id) ON DELETE CASCADE,
    CONSTRAINT fk_schedule_teacher FOREIGN KEY (teacher_id) REFERENCES person(id) ON DELETE RESTRICT,
    CONSTRAINT fk_schedule_auditorium FOREIGN KEY (auditorium_id) REFERENCES auditorium(id) ON DELETE SET NULL,
    CONSTRAINT fk_schedule_group FOREIGN KEY (group_id) REFERENCES "group"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    student_id UUID NOT NULL,
    pair INT NOT NULL,
    CONSTRAINT fk_attendance_student FOREIGN KEY (student_id) REFERENCES person(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS academic_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    student_id UUID NOT NULL,
    discipline_id UUID NOT NULL,
    teacher_id UUID NOT NULL,
    form_of_control VARCHAR(50) NOT NULL,
    tour INT NOT NULL,
    sign INT NOT NULL,
    CONSTRAINT fk_performance_student FOREIGN KEY (student_id) REFERENCES person(id) ON DELETE CASCADE,
    CONSTRAINT fk_performance_discipline FOREIGN KEY (discipline_id) REFERENCES discipline(id) ON DELETE CASCADE,
    CONSTRAINT fk_performance_teacher FOREIGN KEY (teacher_id) REFERENCES person(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS execution (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    teacher_id UUID NOT NULL,
    discipline_id UUID NOT NULL,
    lectures INT NOT NULL DEFAULT 0,
    practices INT NOT NULL DEFAULT 0,
    lab_works INT NOT NULL DEFAULT 0,
    other_works INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_execution_teacher FOREIGN KEY (teacher_id) REFERENCES person(id) ON DELETE RESTRICT,
    CONSTRAINT fk_execution_discipline FOREIGN KEY (discipline_id) REFERENCES discipline(id) ON DELETE CASCADE
);

-- User auth tables
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    person_id UUID NOT NULL UNIQUE,
    role_id UUID NOT NULL,
    username VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    CONSTRAINT fk_user_person FOREIGN KEY (person_id) REFERENCES person(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES role(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    user_id UUID NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vocation_faculty ON vocation(faculty_id);
CREATE INDEX IF NOT EXISTS idx_group_vocation ON "group"(vocation_id);
CREATE INDEX IF NOT EXISTS idx_student_group ON student_profile(group_id);
CREATE INDEX IF NOT EXISTS idx_staff_profile_person ON staff_profile(person_id);
CREATE INDEX IF NOT EXISTS idx_person_email ON person(email);
CREATE INDEX IF NOT EXISTS idx_subject_name ON subject(name);
CREATE INDEX IF NOT EXISTS idx_user_username ON users(username);

-- Seed default admin role
INSERT INTO role (id, name, is_active) VALUES (uuid_generate_v4(), 'Admin', true) ON CONFLICT DO NOTHING;