package main

import (
	"context"

	"UniversityAcademicRecordsSystem/internal/handlers"
	"UniversityAcademicRecordsSystem/internal/models"
	"UniversityAcademicRecordsSystem/internal/services"
)

type App struct {
	inner *handlers.App
}

func NewApp() *App {
	app, err := handlers.NewApp()
	if err != nil {
		panic(err)
	}
	return &App{inner: app}
}

func (a *App) Startup(ctx context.Context) {
	a.inner.Startup(ctx)
}

func (a *App) Login(request services.LoginRequest) (services.AuthResponse, error) {
	return a.inner.Login(request)
}

func (a *App) RestoreSession(token string) (*services.CurrentUserView, error) {
	return a.inner.RestoreSession(token)
}

func (a *App) Logout() error {
	return a.inner.Logout()
}

func (a *App) CurrentUser() (*services.CurrentUserView, error) {
	return a.inner.CurrentUser()
}

func (a *App) DashboardStats() (models.DashboardStats, error) {
	return a.inner.DashboardStats()
}

func (a *App) ListRecords(module string, search string, page, pageSize int) (models.PageResult, error) {
	return a.inner.ListRecords(module, search, page, pageSize)
}

func (a *App) GetRecord(module string, id string) (map[string]any, error) {
	return a.inner.GetRecord(module, id)
}

func (a *App) CreateRecord(module string, payload map[string]any) (map[string]any, error) {
	return a.inner.CreateRecord(module, payload)
}

func (a *App) UpdateRecord(module string, id string, payload map[string]any) (map[string]any, error) {
	return a.inner.UpdateRecord(module, id, payload)
}

func (a *App) DeleteRecord(module string, id string) error {
	return a.inner.DeleteRecord(module, id)
}

func (a *App) ListOptions(module string) ([]models.OptionItem, error) {
	return a.inner.ListOptions(module)
}

func (a *App) ScheduleFilters() (services.ScheduleFilters, error) {
	return a.inner.ScheduleFilters()
}

func (a *App) WeeklySchedule(facultyID, vocationID, educationYear, groupID string) ([]map[string]any, error) {
	return a.inner.WeeklySchedule(facultyID, vocationID, educationYear, groupID)
}

func (a *App) Ping() string {
	return a.inner.Ping()
}
