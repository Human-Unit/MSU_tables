package models

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	Base
	PersonID     uuid.UUID `gorm:"type:uuid;not null;unique" json:"personId"`
	Person       Person    `gorm:"foreignKey:PersonID;constraint:OnDelete:CASCADE" json:"person"`
	RoleID       uuid.UUID `gorm:"type:uuid;not null;index" json:"roleId"`
	Role         Role      `gorm:"foreignKey:RoleID;constraint:OnDelete:RESTRICT" json:"role"`
	Username     string    `gorm:"size:100;unique;not null" json:"username"`
	PasswordHash string    `gorm:"size:255;not null" json:"-"`
}

func (User) TableName() string { return "users" }

type Session struct {
	Base
	UserID    uuid.UUID `gorm:"type:uuid;not null;index" json:"userId"`
	User      User      `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"user"`
	Token     string    `gorm:"size:255;unique;not null" json:"token"`
	ExpiresAt time.Time `gorm:"not null" json:"expiresAt"`
}

func (Session) TableName() string { return "sessions" }
