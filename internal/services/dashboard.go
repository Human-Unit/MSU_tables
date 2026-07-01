package services

import (
	"context"

	"UniversityAcademicRecordsSystem/internal/models"

	"gorm.io/gorm"
)

type DashboardService struct {
	db *gorm.DB
}

func NewDashboardService(db *gorm.DB) *DashboardService {
	return &DashboardService{db: db}
}

func (s *DashboardService) Stats(ctx context.Context) (models.DashboardStats, error) {
	var stats models.DashboardStats
	if err := s.db.WithContext(ctx).Model(&models.StudentProfile{}).Count(&stats.TotalStudents).Error; err != nil {
		return stats, err
	}
	if err := s.db.WithContext(ctx).Model(&models.StaffProfile{}).Count(&stats.TotalTeachers).Error; err != nil {
		return stats, err
	}
	if err := s.db.WithContext(ctx).Model(&models.Group{}).Count(&stats.TotalGroups).Error; err != nil {
		return stats, err
	}
	if err := s.db.WithContext(ctx).Model(&models.Subject{}).Count(&stats.TotalSubjects).Error; err != nil {
		return stats, err
	}

	if err := s.db.WithContext(ctx).
		Model(&models.StudentProfile{}).
		Preload("Person").
		Preload("Group").
		Order("created_at desc").
		Limit(5).
		Find(&stats.RecentStudents).Error; err != nil {
		return stats, err
	}

	if err := s.db.WithContext(ctx).
		Model(&models.StaffProfile{}).
		Preload("Person").
		Order("created_at desc").
		Limit(5).
		Find(&stats.RecentTeachers).Error; err != nil {
		return stats, err
	}

	return stats, nil
}
