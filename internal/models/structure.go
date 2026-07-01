package models

import (
	"time"

	"github.com/google/uuid"
)

type Faculty struct {
	Base
	Name string `gorm:"size:150;unique;not null" json:"name"`
}

func (Faculty) TableName() string { return "faculty" }

type Vocation struct {
	Base
	Name      string     `gorm:"size:150;unique;not null" json:"name"`
	FacultyID *uuid.UUID `gorm:"type:uuid;index" json:"facultyId,omitempty"`
	Faculty   *Faculty   `gorm:"foreignKey:FacultyID;constraint:OnDelete:SET NULL" json:"faculty,omitempty"`
}

func (Vocation) TableName() string { return "vocation" }

type Group struct {
	Base
	Name          string    `gorm:"size:50;unique;not null" json:"name"`
	VocationID    uuid.UUID `gorm:"type:uuid;not null;index" json:"vocationId"`
	Vocation      Vocation  `gorm:"foreignKey:VocationID;constraint:OnDelete:RESTRICT" json:"vocation"`
	EducationYear int       `gorm:"not null" json:"educationYear"`
}

func (Group) TableName() string { return "group" }

type Auditorium struct {
	Base
	Number string         `gorm:"size:20;unique;not null" json:"number"`
	Type   AuditoriumType `gorm:"type:auditorium_type;not null" json:"type"`
}

func (Auditorium) TableName() string { return "auditorium" }

type Role struct {
	Base
	Name string `gorm:"size:50;unique;not null" json:"name"`
}

func (Role) TableName() string { return "role" }

type Subject struct {
	Base
	Name            string  `gorm:"size:150;unique;not null" json:"name"`
	Semester        int     `gorm:"not null" json:"semester"`
	QuantityOfHours int     `gorm:"not null" json:"quantityOfHours"`
	CreditsECTS     float64 `gorm:"type:decimal(4,1);default:0" json:"creditsECTS"`
	FormOfControl   string  `gorm:"size:50;not null" json:"formOfControl"`
}

func (Subject) TableName() string { return "subject" }

type Week struct {
	Base
	Name         string    `gorm:"size:100;not null" json:"name"`
	DateOfStart  time.Time `gorm:"not null" json:"dateOfStart"`
	DateOfEnding time.Time `gorm:"not null" json:"dateOfEnding"`
}

func (Week) TableName() string { return "week" }
