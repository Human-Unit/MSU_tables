package services

import "time"

type CurrentUserView struct {
	ID       string `json:"id"`
	PersonID string `json:"personId"`
	RoleID   string `json:"roleId"`
	RoleName string `json:"roleName"`
	Username string `json:"username"`
	FullName string `json:"fullName"`
	Email    string `json:"email,omitempty"`
	IsActive bool   `json:"isActive"`
}

type AuthResponse struct {
	Token string          `json:"token"`
	User  CurrentUserView `json:"user"`
}

type StudentUpsertRequest struct {
	FullName    string     `json:"fullName"`
	DateOfBirth *time.Time `json:"dateOfBirth,omitempty"`
	Phone       string     `json:"phone,omitempty"`
	Address     string     `json:"address,omitempty"`
	Email       string     `json:"email,omitempty"`
	GroupID     string     `json:"groupId"`
	Username    string     `json:"username"`
	Password    string     `json:"password"`
	IsActive    bool       `json:"isActive"`
}

type TeacherUpsertRequest struct {
	FullName      string     `json:"fullName"`
	DateOfBirth   *time.Time `json:"dateOfBirth,omitempty"`
	Phone         string     `json:"phone,omitempty"`
	Address       string     `json:"address,omitempty"`
	Email         string     `json:"email,omitempty"`
	ScienceDegree string     `json:"scienceDegree,omitempty"`
	ScienceRank   string     `json:"scienceRank,omitempty"`
	Occupation    string     `json:"occupation,omitempty"`
	Username      string     `json:"username"`
	Password      string     `json:"password"`
	IsActive      bool       `json:"isActive"`
}

type StudentRow struct {
	PersonID    string     `json:"personId"`
	FullName    string     `json:"fullName"`
	DateOfBirth *time.Time `json:"dateOfBirth,omitempty"`
	Phone       string     `json:"phone,omitempty"`
	Address     string     `json:"address,omitempty"`
	Email       string     `json:"email,omitempty"`
	GroupID     string     `json:"groupId"`
	GroupName   string     `json:"groupName"`
	Username    string     `json:"username,omitempty"`
	RoleName    string     `json:"roleName,omitempty"`
	IsActive    bool       `json:"isActive"`
}

type TeacherRow struct {
	PersonID      string     `json:"personId"`
	FullName      string     `json:"fullName"`
	DateOfBirth   *time.Time `json:"dateOfBirth,omitempty"`
	Phone         string     `json:"phone,omitempty"`
	Address       string     `json:"address,omitempty"`
	Email         string     `json:"email,omitempty"`
	ScienceDegree string     `json:"scienceDegree,omitempty"`
	ScienceRank   string     `json:"scienceRank,omitempty"`
	Occupation    string     `json:"occupation,omitempty"`
	Username      string     `json:"username,omitempty"`
	RoleName      string     `json:"roleName,omitempty"`
	IsActive      bool       `json:"isActive"`
}
