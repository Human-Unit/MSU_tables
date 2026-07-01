package models

type OptionItem struct {
	ID    string `json:"id"`
	Label string `json:"label"`
}

type DashboardStats struct {
	TotalStudents  int64            `json:"totalStudents"`
	TotalTeachers  int64            `json:"totalTeachers"`
	TotalGroups    int64            `json:"totalGroups"`
	TotalSubjects  int64            `json:"totalSubjects"`
	RecentStudents []map[string]any `json:"recentStudents,omitempty"`
	RecentTeachers []map[string]any `json:"recentTeachers,omitempty"`
}

type PageResult struct {
	Items    []map[string]any `json:"items"`
	Page     int              `json:"page"`
	PageSize int              `json:"pageSize"`
	Total    int64            `json:"total"`
}
