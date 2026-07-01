package services

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"time"

	"UniversityAcademicRecordsSystem/internal/models"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthService struct {
	db              *gorm.DB
	sessionDuration time.Duration
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func NewAuthService(db *gorm.DB, sessionDuration time.Duration) *AuthService {
	return &AuthService{db: db, sessionDuration: sessionDuration}
}

func (s *AuthService) Login(ctx context.Context, request LoginRequest) (AuthResponse, error) {
	if err := requireString(request.Username, "username"); err != nil {
		return AuthResponse{}, err
	}
	if err := requireString(request.Password, "password"); err != nil {
		return AuthResponse{}, err
	}

	var user models.User
	if err := s.db.WithContext(ctx).Preload("Person").Preload("Role").Where("username = ?", request.Username).First(&user).Error; err != nil {
		return AuthResponse{}, ErrAuth
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(request.Password)); err != nil {
		return AuthResponse{}, ErrAuth
	}

	token, err := randomToken(32)
	if err != nil {
		return AuthResponse{}, err
	}

	session := models.Session{
		UserID:    user.ID,
		Token:     token,
		ExpiresAt: time.Now().Add(s.sessionDuration),
	}
	if err := s.db.WithContext(ctx).Create(&session).Error; err != nil {
		return AuthResponse{}, err
	}

	return AuthResponse{
		Token: token,
		User:  toCurrentUserView(user),
	}, nil
}

func (s *AuthService) Logout(ctx context.Context, token string) error {
	if token == "" {
		return nil
	}
	return s.db.WithContext(ctx).Where("token = ?", token).Delete(&models.Session{}).Error
}

func (s *AuthService) ValidateSession(ctx context.Context, token string) (*CurrentUserView, error) {
	if token == "" {
		return nil, ErrAuth
	}

	var session models.Session
	if err := s.db.WithContext(ctx).Preload("User").Preload("User.Person").Preload("User.Role").Where("token = ?", token).First(&session).Error; err != nil {
		return nil, ErrAuth
	}
	if time.Now().After(session.ExpiresAt) {
		_ = s.db.WithContext(ctx).Delete(&session).Error
		return nil, ErrAuth
	}

	view := toCurrentUserView(session.User)
	return &view, nil
}

func toCurrentUserView(user models.User) CurrentUserView {
	return CurrentUserView{
		ID:       user.ID.String(),
		PersonID: user.PersonID.String(),
		RoleID:   user.RoleID.String(),
		RoleName: user.Role.Name,
		Username: user.Username,
		FullName: user.Person.FullName,
		Email:    user.Person.Email,
		IsActive: user.IsActive,
	}
}

func randomToken(size int) (string, error) {
	buf := make([]byte, size)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(buf), nil
}

func (s *AuthService) MustRoleID(ctx context.Context, name string) (string, error) {
	var role models.Role
	if err := s.db.WithContext(ctx).Where("name = ?", name).First(&role).Error; err != nil {
		return "", fmt.Errorf("%w: role %s not found", ErrValidation, name)
	}
	return role.ID.String(), nil
}

func (s *AuthService) UsernameExists(ctx context.Context, username string, excludeID ...string) (bool, error) {
	var count int64
	query := s.db.WithContext(ctx).Model(&models.User{}).Where("username = ?", username)
	if len(excludeID) > 0 && excludeID[0] != "" {
		query = query.Where("id != ?", excludeID[0])
	}
	if err := query.Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}
