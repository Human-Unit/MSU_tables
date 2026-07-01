package handlers

import (
	"context"
	"fmt"
	"sync"

	"UniversityAcademicRecordsSystem/internal/models"
	"UniversityAcademicRecordsSystem/internal/services"
)

type App struct {
	ctx       context.Context
	container *services.Container
	initOnce  sync.Once
	initErr   error
}

func NewApp() (*App, error) {
	return &App{}, nil
}

func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
	if err := a.initContainer(); err != nil {
		// Surface DB problems to the UI instead of starting silently broken.
		fmt.Println("Startup DB init error:", err)
	}
}

func (a *App) Login(request services.LoginRequest) (services.AuthResponse, error) {
	_ = request
	return services.AuthResponse{
		User: services.CurrentUserView{
			ID:       "local-user",
			RoleName: "Admin",
			Username: "local",
			FullName: "Local User",
			IsActive: true,
		},
	}, nil
}

func (a *App) RestoreSession(token string) (*services.CurrentUserView, error) {
	_ = token
	return a.CurrentUser()
}

func (a *App) Logout() error {
	return nil
}

func (a *App) CurrentUser() (*services.CurrentUserView, error) {
	if err := a.initContainer(); err != nil {
		return nil, err
	}
	return &services.CurrentUserView{
		ID:       "local-user",
		RoleName: "Admin",
		Username: "local",
		FullName: "Local User",
		IsActive: true,
	}, nil
}

func (a *App) DashboardStats() (models.DashboardStats, error) {
	if err := a.initContainer(); err != nil {
		return models.DashboardStats{}, err
	}
	return a.container.Dashboard.Stats(a.ctx)
}

func (a *App) ListRecords(module string, search string, page, pageSize int) (models.PageResult, error) {
	if err := a.initContainer(); err != nil {
		return models.PageResult{}, err
	}
	return a.container.Records.List(a.ctx, module, search, page, pageSize)
}

func (a *App) GetRecord(module string, id string) (map[string]any, error) {
	if err := a.initContainer(); err != nil {
		return nil, err
	}
	return a.container.Records.Get(a.ctx, module, id)
}

func (a *App) CreateRecord(module string, payload map[string]any) (map[string]any, error) {
	if err := a.initContainer(); err != nil {
		return nil, err
	}
	return a.container.Records.Create(a.ctx, module, payload)
}

func (a *App) UpdateRecord(module string, id string, payload map[string]any) (map[string]any, error) {
	if err := a.initContainer(); err != nil {
		return nil, err
	}
	return a.container.Records.Update(a.ctx, module, id, payload)
}

func (a *App) DeleteRecord(module string, id string) error {
	if err := a.initContainer(); err != nil {
		return err
	}
	return a.container.Records.Delete(a.ctx, module, id)
}

func (a *App) ListOptions(module string) ([]models.OptionItem, error) {
	if err := a.initContainer(); err != nil {
		return nil, err
	}
	return a.container.Records.Options(a.ctx, module)
}

func (a *App) ScheduleFilters() (services.ScheduleFilters, error) {
	if err := a.initContainer(); err != nil {
		return services.ScheduleFilters{}, err
	}
	return a.container.Schedule.Filters(a.ctx)
}

func (a *App) WeeklySchedule(facultyID, vocationID, educationYear, groupID string) ([]map[string]any, error) {
	if err := a.initContainer(); err != nil {
		return nil, err
	}
	return a.container.Schedule.Weekly(a.ctx, facultyID, vocationID, educationYear, groupID)
}

func (a *App) Ping() string {
	return "pong"
}

func (a *App) initContainer() error {
	if err := a.ensureContext(); err != nil {
		return err
	}
	a.initOnce.Do(func() {
		a.container, a.initErr = services.NewContainer(a.ctx)
	})
	return a.initErr
}

func (a *App) ensureContext() error {
	if a.ctx == nil {
		a.ctx = context.Background()
	}
	return nil
}
