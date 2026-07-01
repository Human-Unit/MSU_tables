package database

import (
	"fmt"
	"log/slog"
	"os"
	"path/filepath"

	"UniversityAcademicRecordsSystem/internal/config"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Connect(cfg config.Config, appLogger *slog.Logger) (*gorm.DB, error) {
	appLogger.Info("Starting database connection", "working_dir", getWorkingDir())

	db, err := gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{
		Logger: logger.New(
			logWriter{logger: appLogger},
			logger.Config{
				SlowThreshold:             0,
				LogLevel:                  logger.Silent,
				IgnoreRecordNotFoundError: true,
				Colorful:                  false,
			},
		),
	})
	if err != nil {
		return nil, fmt.Errorf("open database: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("get underlying sql.DB: %w", err)
	}
	if err := sqlDB.Ping(); err != nil {
		return nil, fmt.Errorf("ping database: %w", err)
	}

	if err := runMigrations(cfg.DatabaseURL, appLogger); err != nil {
		return nil, fmt.Errorf("run migrations: %w", err)
	}

	return db, nil
}

func runMigrations(databaseURL string, appLogger *slog.Logger) error {
	migrationsDir, err := getMigrationsDir()
	if err != nil {
		return fmt.Errorf("resolve migrations path: %w", err)
	}

	appLogger.Info("Opening migrations from path", "path", migrationsDir)

	// Use an io/fs-based source instead of a hand-built "file://" URL so the
	// migrations load correctly on any OS. On Windows an absolute path such as
	// C:\... cannot be embedded into a file:// URL (the drive letter is parsed
	// as a host:port and rejected).
	source, err := iofs.New(os.DirFS(migrationsDir), ".")
	if err != nil {
		return fmt.Errorf("open migration source %s: %w", migrationsDir, err)
	}
	defer source.Close()

	m, err := migrate.NewWithSourceInstance("iofs", source, databaseURL)
	if err != nil {
		return fmt.Errorf("create migrator: %w", err)
	}

	appLogger.Info("Applying database migrations", "database_url", databaseURL)

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("apply migrations: %w", err)
	}

	if err == migrate.ErrNoChange {
		appLogger.Info("No new migrations to apply")
	} else {
		appLogger.Info("Migrations applied successfully - mock data should be loaded")
	}

	return nil
}

func getMigrationsDir() (string, error) {
	wd, err := os.Getwd()
	if err != nil {
		return "", err
	}
	return filepath.Join(wd, "migrations"), nil
}

func getWorkingDir() string {
	wd, err := os.Getwd()
	if err != nil {
		return "unknown"
	}
	return wd
}

type logWriter struct {
	logger *slog.Logger
}

func (w logWriter) Printf(format string, args ...any) {
	w.logger.Debug(fmt.Sprintf(format, args...))
}
