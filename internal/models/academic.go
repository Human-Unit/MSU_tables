package models

import (
	"github.com/google/uuid"
)

// Exam represents a formal exam assessment (signs 1-5, passing grade is 3 or higher)
type Exam struct {
	Base
	StudentID    uuid.UUID  `gorm:"type:uuid;not null;index" json:"studentId"`
	Student      Person     `gorm:"foreignKey:StudentID;constraint:OnDelete:CASCADE" json:"student"`
	DisciplineID uuid.UUID  `gorm:"type:uuid;not null;index" json:"disciplineId"`
	Discipline   Discipline `gorm:"foreignKey:DisciplineID;constraint:OnDelete:CASCADE" json:"discipline"`
	TeacherID    uuid.UUID  `gorm:"type:uuid;not null;index" json:"teacherId"`
	Teacher      Person     `gorm:"foreignKey:TeacherID;constraint:OnDelete:RESTRICT" json:"teacher"`
	Tour         int        `gorm:"default:1" json:"tour"`
	Sign         int16      `gorm:"not null;check:sign >= 1 AND sign <= 5" json:"sign"`
}

func (Exam) TableName() string { return "exam" }

// Zachet represents a pass/fail test assessment (signs 0-3, passing grade is 1 or higher)
type Zachet struct {
	Base
	StudentID    uuid.UUID  `gorm:"type:uuid;not null;index" json:"studentId"`
	Student      Person     `gorm:"foreignKey:StudentID;constraint:OnDelete:CASCADE" json:"student"`
	DisciplineID uuid.UUID  `gorm:"type:uuid;not null;index" json:"disciplineId"`
	Discipline   Discipline `gorm:"foreignKey:DisciplineID;constraint:OnDelete:CASCADE" json:"discipline"`
	TeacherID    uuid.UUID  `gorm:"type:uuid;not null;index" json:"teacherId"`
	Teacher      Person     `gorm:"foreignKey:TeacherID;constraint:OnDelete:RESTRICT" json:"teacher"`
	Tour         int        `gorm:"default:1" json:"tour"`
	Sign         int16      `gorm:"not null;check:sign >= 0 AND sign <= 3" json:"sign"`
}

func (Zachet) TableName() string { return "zachet" }
