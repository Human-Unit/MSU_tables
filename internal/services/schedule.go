package services

import (
	"context"
	"strconv"

	"UniversityAcademicRecordsSystem/internal/models"

	"gorm.io/gorm"
)

// ScheduleService powers the read-only weekly timetable grid: it exposes the
// cascading filter data (faculty -> vocation -> course -> group) and returns the
// schedule entries that match a chosen filter combination.
type ScheduleService struct {
	db *gorm.DB
}

func NewScheduleService(db *gorm.DB) *ScheduleService {
	return &ScheduleService{db: db}
}

type FacultyOption struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type VocationOption struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	FacultyID string `json:"facultyId"`
}

type GroupOption struct {
	ID            string `json:"id"`
	Name          string `json:"name"`
	VocationID    string `json:"vocationId"`
	EducationYear int    `json:"educationYear"`
}

// ScheduleFilters is the full tree the frontend needs to build the cascading
// selectors client-side without extra round-trips.
type ScheduleFilters struct {
	Faculties []FacultyOption  `json:"faculties"`
	Vocations []VocationOption `json:"vocations"`
	Groups    []GroupOption    `json:"groups"`
}

// Filters returns every faculty, vocation and group so the UI can cascade the
// selectors (faculty -> vocation -> course -> group) on the client.
func (s *ScheduleService) Filters(ctx context.Context) (ScheduleFilters, error) {
	var faculties []models.Faculty
	if err := s.db.WithContext(ctx).Order("name asc").Find(&faculties).Error; err != nil {
		return ScheduleFilters{}, err
	}
	var vocations []models.Vocation
	if err := s.db.WithContext(ctx).Order("name asc").Find(&vocations).Error; err != nil {
		return ScheduleFilters{}, err
	}
	var groups []models.Group
	if err := s.db.WithContext(ctx).Order("name asc").Find(&groups).Error; err != nil {
		return ScheduleFilters{}, err
	}

	out := ScheduleFilters{
		Faculties: make([]FacultyOption, 0, len(faculties)),
		Vocations: make([]VocationOption, 0, len(vocations)),
		Groups:    make([]GroupOption, 0, len(groups)),
	}
	for _, f := range faculties {
		out.Faculties = append(out.Faculties, FacultyOption{ID: f.ID.String(), Name: f.Name})
	}
	for _, v := range vocations {
		facultyID := ""
		if v.FacultyID != nil {
			facultyID = v.FacultyID.String()
		}
		out.Vocations = append(out.Vocations, VocationOption{ID: v.ID.String(), Name: v.Name, FacultyID: facultyID})
	}
	for _, g := range groups {
		out.Groups = append(out.Groups, GroupOption{
			ID:            g.ID.String(),
			Name:          g.Name,
			VocationID:    g.VocationID.String(),
			EducationYear: g.EducationYear,
		})
	}
	return out, nil
}

// Weekly returns the schedule entries matching the supplied filters. All
// arguments are optional (empty string = ignore). When groupID is provided it
// takes precedence; otherwise faculty/vocation/course narrow the result via the
// group relationship.
func (s *ScheduleService) Weekly(ctx context.Context, facultyID, vocationID, educationYear, groupID string) ([]map[string]any, error) {
	query := s.db.WithContext(ctx).Model(&models.Schedule{}).
		Preload("Subject").
		Preload("Teacher").
		Preload("Auditorium").
		Preload("Group").
		Preload("Group.Vocation").
		Preload("Group.Vocation.Faculty")

	if groupID != "" {
		query = query.Where("schedule.group_id = ?", groupID)
	} else {
		needsGroupJoin := vocationID != "" || facultyID != "" || educationYear != ""
		if needsGroupJoin {
			query = query.Joins("JOIN groups ON groups.id = schedule.group_id")
		}
		if educationYear != "" {
			if year, err := strconv.Atoi(educationYear); err == nil {
				query = query.Where("groups.education_year = ?", year)
			}
		}
		if vocationID != "" {
			query = query.Where("groups.vocation_id = ?", vocationID)
		} else if facultyID != "" {
			query = query.Joins("JOIN vocation ON vocation.id = groups.vocation_id").
				Where("vocation.faculty_id = ?", facultyID)
		}
	}

	var schedules []models.Schedule
	if err := query.Order("schedule.weekday asc, schedule.pair asc").Find(&schedules).Error; err != nil {
		return nil, err
	}

	items := make([]map[string]any, 0, len(schedules))
	for i := range schedules {
		item, err := toMap(schedules[i])
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, nil
}
