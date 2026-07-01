package models

import (
	"time"

	"github.com/google/uuid"
)

type Person struct {
	Base
	FullName    string     `gorm:"size:150;not null" json:"fullName"`
	DateOfBirth *time.Time `json:"dateOfBirth,omitempty"`
	Phone       string     `gorm:"size:20" json:"phone,omitempty"`
	Address     string     `gorm:"type:text" json:"address,omitempty"`
	Email       string     `gorm:"size:100;unique" json:"email,omitempty"`
}

func (Person) TableName() string { return "person" }

type StaffProfile struct {
	PersonID      uuid.UUID `gorm:"type:uuid;primaryKey" json:"personId"`
	Person        Person    `gorm:"foreignKey:PersonID;constraint:OnDelete:CASCADE" json:"person"`
	ScienceDegree string    `gorm:"size:100" json:"scienceDegree,omitempty"`
	ScienceRank   string    `gorm:"size:100" json:"scienceRank,omitempty"`
	Occupation    string    `gorm:"size:100" json:"occupation,omitempty"`
	Audit
}

func (StaffProfile) TableName() string { return "staff_profile" }

type StudentProfile struct {
	PersonID uuid.UUID `gorm:"type:uuid;primaryKey" json:"personId"`
	Person   Person    `gorm:"foreignKey:PersonID;constraint:OnDelete:CASCADE" json:"person"`
	GroupID  uuid.UUID `gorm:"type:uuid;not null;index" json:"groupId"`
	Group    Group     `gorm:"foreignKey:GroupID;constraint:OnDelete:RESTRICT" json:"group"`
	Audit
}

func (StudentProfile) TableName() string { return "student_profile" }
