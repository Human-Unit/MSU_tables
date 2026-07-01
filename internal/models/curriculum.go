package models

import (
	"github.com/google/uuid"
)

type Discipline struct {
	Base
	SubjectID                  uuid.UUID `gorm:"type:uuid;not null;index" json:"subjectId"`
	Subject                    Subject   `gorm:"foreignKey:SubjectID;constraint:OnDelete:CASCADE" json:"subject"`
	TeacherID                  uuid.UUID `gorm:"type:uuid;not null;index" json:"teacherId"`
	Teacher                    Person    `gorm:"foreignKey:TeacherID;constraint:OnDelete:RESTRICT" json:"teacher"`
	GroupID                    uuid.UUID `gorm:"type:uuid;not null;index" json:"groupId"`
	Group                      Group     `gorm:"foreignKey:GroupID;constraint:OnDelete:CASCADE" json:"group"`
	QuantityOfLectures         int       `gorm:"default:0" json:"quantityOfLectures"`
	QuantityOfPracticalLessons int       `gorm:"default:0" json:"quantityOfPracticalLessons"`
	QuantityOfLabWorks         int       `gorm:"default:0" json:"quantityOfLabWorks"`
	OtherWorks                 int       `gorm:"default:0" json:"otherWorks"`
	SelfControl                int       `gorm:"default:0" json:"selfControl"`
}

func (Discipline) TableName() string { return "discipline" }

type Schedule struct {
	Base
	// Weekday is a recurring day of the week: 1=Monday ... 6=Saturday.
	Weekday      int         `gorm:"not null;default:1" json:"weekday"`
	Pair         int         `gorm:"not null" json:"pair"`
	SubjectID    uuid.UUID   `gorm:"type:uuid;not null;index" json:"subjectId"`
	Subject      Subject     `gorm:"foreignKey:SubjectID;constraint:OnDelete:CASCADE" json:"subject"`
	TeacherID    uuid.UUID   `gorm:"type:uuid;not null;index" json:"teacherId"`
	Teacher      Person      `gorm:"foreignKey:TeacherID;constraint:OnDelete:RESTRICT" json:"teacher"`
	TypeOfLesson LessonType  `gorm:"type:lesson_type;not null" json:"typeOfLesson"`
	AuditoriumID *uuid.UUID  `gorm:"type:uuid;index" json:"auditoriumId,omitempty"`
	Auditorium   *Auditorium `gorm:"foreignKey:AuditoriumID;constraint:OnDelete:SET NULL" json:"auditorium,omitempty"`
	GroupID      uuid.UUID   `gorm:"type:uuid;not null;index" json:"groupId"`
	Group        Group       `gorm:"foreignKey:GroupID;constraint:OnDelete:CASCADE" json:"group"`
}

func (Schedule) TableName() string { return "schedule" }
