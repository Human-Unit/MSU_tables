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

	// The schedule moved from a concrete date ("day") to a recurring weekday.
	// Drop the legacy NOT NULL "day" column so GORM inserts (which no longer
	// provide it) do not fail. AutoMigrate then adds the new "weekday" column.
	if err := db.Exec(`ALTER TABLE schedule DROP COLUMN IF EXISTS day`).Error; err != nil {
		return fmt.Errorf("drop legacy schedule.day column: %w", err)
	}

	return db.AutoMigrate(
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
		&models.User{},
		&models.Session{},
	)
}
