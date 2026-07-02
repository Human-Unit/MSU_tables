package models

import (
	"time"

	"github.com/google/uuid"
)

type Attendance struct {
	Base
	StudentID    uuid.UUID        `gorm:"type:uuid;not null;index" json:"studentId"`
	Student      Person           `gorm:"foreignKey:StudentID;constraint:OnDelete:CASCADE" json:"student"`
	DisciplineID uuid.UUID        `gorm:"type:uuid;not null;index" json:"disciplineId"`
	Discipline   Discipline       `gorm:"foreignKey:DisciplineID;constraint:OnDelete:CASCADE" json:"discipline"`
	Day          time.Time        `gorm:"not null" json:"day"`
	Pair         int              `gorm:"not null" json:"pair"`
	Status       AttendanceStatus `gorm:"size:10;not null;default:present" json:"status"`
}

func (Attendance) TableName() string { return "attendance" }

type AcademicPerformance struct {
	Base
	StudentID     uuid.UUID     `gorm:"type:uuid;not null;index" json:"studentId"`
	Student       Person        `gorm:"foreignKey:StudentID;constraint:OnDelete:CASCADE" json:"student"`
	DisciplineID  uuid.UUID     `gorm:"type:uuid;not null;index" json:"disciplineId"`
	Discipline    Discipline    `gorm:"foreignKey:DisciplineID;constraint:OnDelete:CASCADE" json:"discipline"`
	TeacherID     uuid.UUID     `gorm:"type:uuid;not null;index" json:"teacherId"`
	Teacher       Person        `gorm:"foreignKey:TeacherID;constraint:OnDelete:RESTRICT" json:"teacher"`
	FormOfControl FormOfControl `gorm:"size:10;not null" json:"formOfControl"`
	Tour          int           `gorm:"default:1" json:"tour"`
	Sign          int16         `gorm:"not null" json:"sign"`
}

func (AcademicPerformance) TableName() string { return "academic_performance" }

type Execution struct {
	Base
	TeacherID    uuid.UUID  `gorm:"type:uuid;not null;index" json:"teacherId"`
	Teacher      Person     `gorm:"foreignKey:TeacherID;constraint:OnDelete:CASCADE" json:"teacher"`
	DisciplineID uuid.UUID  `gorm:"type:uuid;not null;index" json:"disciplineId"`
	Discipline   Discipline `gorm:"foreignKey:DisciplineID;constraint:OnDelete:CASCADE" json:"discipline"`
	Lectures     int        `gorm:"default:0" json:"lectures"`
	Practices    int        `gorm:"default:0" json:"practices"`
	LabWorks     int        `gorm:"default:0" json:"labWorks"`
	OtherWorks   int        `gorm:"default:0" json:"otherWorks"`
}

func (Execution) TableName() string { return "execution" }
