package database

import (
	"fmt"

	"UniversityAcademicRecordsSystem/internal/models"

	"gorm.io/gorm"
)

func Migrate(db *gorm.DB) error {
	if err := db.Exec(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`).Error; err != nil {
		return fmt.Errorf("create uuid-ossp extension: %w", err)
	}

	typeStatements := []string{
		`DO $$ BEGIN CREATE TYPE auditorium_type AS ENUM ('lecture', 'practice', 'flow'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
		`DO $$ BEGIN CREATE TYPE lesson_type AS ENUM ('lecture', 'practice', 'lab'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
	}

	for _, stmt := range typeStatements {
		if err := db.Exec(stmt).Error; err != nil {
			return fmt.Errorf("create enum type: %w", err)
		}
	}

	// Drop the legacy constraint that only covered (student_id, day, pair).
	if err := db.Exec(`
		DO $$ BEGIN
			ALTER TABLE attendance DROP CONSTRAINT IF EXISTS uq_attendance_student_day_pair;
		EXCEPTION WHEN undefined_object THEN NULL;
		END $$;
	`).Error; err != nil {
		return fmt.Errorf("drop legacy attendance unique constraint: %w", err)
	}

	// The schedule moved from a concrete date ("day") to a recurring weekday.
	if err := db.Exec(`ALTER TABLE schedule DROP COLUMN IF EXISTS day`).Error; err != nil {
		return fmt.Errorf("drop legacy schedule.day column: %w", err)
	}

	// ---- Attendance schema migration ----

	// 1. Add nullable discipline_id column.
	if err := db.Exec(`
		DO $$ BEGIN
			ALTER TABLE attendance ADD COLUMN IF NOT EXISTS discipline_id UUID;
		EXCEPTION WHEN duplicate_column THEN NULL;
		END $$;
	`).Error; err != nil {
		return fmt.Errorf("add attendance discipline_id column: %w", err)
	}

	// 2. Ensure at least one discipline exists (needed as a fallback).
	if err := db.Exec(`
		INSERT INTO discipline (id, subject_id, teacher_id, group_id, created_at, updated_at, is_active)
		SELECT uuid_generate_v4(), s.id, p.id, g.id, now(), now(), true
		FROM subject s, person p, "group" g
		WHERE NOT EXISTS (SELECT 1 FROM discipline LIMIT 1)
		LIMIT 1
	`).Error; err != nil {
		_ = err // best-effort; disciplines likely already exist from migration 000002
	}

	// 3. Grab a fallback discipline ID.
	type IDRow struct {
		ID string
	}
	var fallback IDRow
	if err := db.Raw(`SELECT id FROM discipline ORDER BY created_at ASC LIMIT 1`).Scan(&fallback).Error; err != nil {
		return fmt.Errorf("query fallback discipline: %w", err)
	}
	if fallback.ID == "" {
		return fmt.Errorf("no discipline record exists — cannot backfill attendance")
	}

	// 4. Backfill: assign each attendance row a discipline from the student's group,
	//    falling back to the global fallback if no match exists.
	if err := db.Exec(`
		UPDATE attendance
		SET discipline_id = COALESCE(
			(SELECT d.id FROM discipline d
			 INNER JOIN student_profile sp ON sp.group_id = d.group_id
			 WHERE sp.person_id = attendance.student_id
			 LIMIT 1),
			?
		)
		WHERE discipline_id IS NULL
	`, fallback.ID).Error; err != nil {
		return fmt.Errorf("backfill attendance discipline_id: %w", err)
	}

	// 5. Safety catch-all: any row that is somehow still NULL gets the fallback.
	if err := db.Exec(`UPDATE attendance SET discipline_id = ? WHERE discipline_id IS NULL`, fallback.ID).Error; err != nil {
		return fmt.Errorf("backfill attendance discipline_id (catch-all): %w", err)
	}

	// 6. Reset the column default to the fallback (AutoMigrate sets NOT NULL + no default,
	//    which is fine — the backfill above ensures no rows are NULL).
	if err := db.Exec(`ALTER TABLE attendance ALTER COLUMN discipline_id SET NOT NULL`).Error; err != nil {
		// If it's already NOT NULL (previous partial run), that's fine.
		// The real error would be "contains null values" — if we still hit it,
		// the catch-all update above didn't execute cleanly.
		return fmt.Errorf("set attendance discipline_id NOT NULL: %w", err)
	}

	// 7. Add status column and migrate old sign data.
	if err := db.Exec(`
		DO $$ BEGIN
			ALTER TABLE attendance ADD COLUMN IF NOT EXISTS status VARCHAR(10) DEFAULT 'present';
		EXCEPTION WHEN duplicate_column THEN NULL;
		END $$;
	`).Error; err != nil {
		return fmt.Errorf("add attendance status column: %w", err)
	}

	if err := db.Exec(`
		DO $$
		DECLARE
			col_exists boolean;
		BEGIN
			SELECT EXISTS (
				SELECT 1 FROM information_schema.columns
				WHERE table_name = 'attendance' AND column_name = 'sign'
			) INTO col_exists;
			IF col_exists THEN
				UPDATE attendance SET status = CASE WHEN sign THEN 'present' ELSE 'absent' END;
			END IF;
		END $$;
	`).Error; err != nil {
		return fmt.Errorf("backfill attendance status from sign: %w", err)
	}

	// ---- End attendance migration ----

	if err := db.AutoMigrate(
		&models.Faculty{},
		&models.Vocation{},
		&models.Group{},
		&models.Auditorium{},
		&models.Role{},
		&models.Person{},
		&models.StaffProfile{},
		&models.StudentProfile{},
		&models.Subject{},
		&models.Discipline{},
		&models.Week{},
		&models.Schedule{},
		&models.Attendance{},
		&models.AcademicPerformance{},
		&models.Execution{},
		&models.Exam{},
		&models.Zachet{},
		&models.User{},
		&models.Session{},
	); err != nil {
		return err
	}

	// Add unique constraint including discipline_id.
	if err := db.Exec(`
		DO $$ BEGIN
			ALTER TABLE attendance ADD CONSTRAINT uq_attendance_student_discipline_day_pair
				UNIQUE (student_id, discipline_id, day, pair);
		EXCEPTION WHEN duplicate_table THEN NULL;
		END $$;
	`).Error; err != nil {
		return fmt.Errorf("add attendance unique constraint: %w", err)
	}

	return nil
}
