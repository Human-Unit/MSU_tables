package services

import (
	"context"
	"log/slog"

	"UniversityAcademicRecordsSystem/internal/config"
	"UniversityAcademicRecordsSystem/internal/database"
	"UniversityAcademicRecordsSystem/internal/logger"
	"UniversityAcademicRecordsSystem/internal/models"

	"gorm.io/gorm"
)

type Container struct {
	Config    config.Config
	Logger    *slog.Logger
	DB        *gorm.DB
	Auth      *AuthService
	Dashboard *DashboardService
	Records   *RecordFacade
	Students  *StudentService
	Teachers  *TeacherService
	Schedule  *ScheduleService
}

type RecordFacade struct {
	Simple   *SimpleModuleService
	Students *StudentService
	Teachers *TeacherService
}

func NewContainer(ctx context.Context) (*Container, error) {
	cfg := config.Load()
	appLogger := logger.New(cfg.LogLevel)

	db, err := database.Connect(cfg, appLogger)
	if err != nil {
		return nil, err
	}
	if err := database.Migrate(db); err != nil {
		return nil, err
	}
	if err := database.Seed(ctx, db, cfg.SeedAdminUser, cfg.SeedAdminPassword); err != nil {
		return nil, err
	}

	auth := NewAuthService(db, cfg.SessionDuration)
	students := NewStudentService(db, auth)
	teachers := NewTeacherService(db, auth)
	simple := NewSimpleModuleService(db)

	return &Container{
		Config:    cfg,
		Logger:    appLogger,
		DB:        db,
		Auth:      auth,
		Dashboard: NewDashboardService(db),
		Records:   &RecordFacade{Simple: simple, Students: students, Teachers: teachers},
		Students:  students,
		Teachers:  teachers,
		Schedule:  NewScheduleService(db),
	}, nil
}

func (r *RecordFacade) List(ctx context.Context, module string, search string, page, pageSize int) (models.PageResult, error) {
	switch module {
	case "students":
		return r.Students.List(ctx, search, page, pageSize)
	case "teachers":
		return r.Teachers.List(ctx, search, page, pageSize)
	default:
		return r.Simple.List(ctx, module, search, page, pageSize)
	}
}

func (r *RecordFacade) Get(ctx context.Context, module, id string) (map[string]any, error) {
	switch module {
	case "students":
		return r.Students.Get(ctx, id)
	case "teachers":
		return r.Teachers.Get(ctx, id)
	default:
		return r.Simple.Get(ctx, module, id)
	}
}

func (r *RecordFacade) Create(ctx context.Context, module string, payload map[string]any) (map[string]any, error) {
	switch module {
	case "students":
		return r.Students.Create(ctx, toStudentRequest(payload))
	case "teachers":
		return r.Teachers.Create(ctx, toTeacherRequest(payload))
	default:
		return r.Simple.Create(ctx, module, payload)
	}
}

func (r *RecordFacade) Update(ctx context.Context, module, id string, payload map[string]any) (map[string]any, error) {
	switch module {
	case "students":
		return r.Students.Update(ctx, id, toStudentRequest(payload))
	case "teachers":
		return r.Teachers.Update(ctx, id, toTeacherRequest(payload))
	default:
		return r.Simple.Update(ctx, module, id, payload)
	}
}

func (r *RecordFacade) Delete(ctx context.Context, module, id string) error {
	switch module {
	case "students":
		return r.Students.Delete(ctx, id)
	case "teachers":
		return r.Teachers.Delete(ctx, id)
	default:
		return r.Simple.Delete(ctx, module, id)
	}
}

func (r *RecordFacade) Options(ctx context.Context, module string) ([]models.OptionItem, error) {
	switch module {
	case "students":
		return r.Students.Options(ctx)
	case "teachers":
		return r.Teachers.Options(ctx)
	default:
		return r.Simple.Options(ctx, module)
	}
}
