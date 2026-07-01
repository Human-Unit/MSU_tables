package services

import (
	"context"
	"fmt"
	"strings"

	"UniversityAcademicRecordsSystem/internal/models"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type StudentService struct {
	db   *gorm.DB
	auth *AuthService
}

type TeacherService struct {
	db   *gorm.DB
	auth *AuthService
}

func NewStudentService(db *gorm.DB, auth *AuthService) *StudentService {
	return &StudentService{db: db, auth: auth}
}

func NewTeacherService(db *gorm.DB, auth *AuthService) *TeacherService {
	return &TeacherService{db: db, auth: auth}
}

func (s *StudentService) List(ctx context.Context, search string, page, pageSize int) (models.PageResult, error) {
	return listStudentRows(ctx, s.db, search, page, pageSize)
}

func (s *StudentService) Get(ctx context.Context, id string) (map[string]any, error) {
	row, err := getStudentRow(ctx, s.db, id)
	if err != nil {
		return nil, err
	}
	return toMap(row)
}

func (s *StudentService) Create(ctx context.Context, req StudentUpsertRequest) (map[string]any, error) {
	if err := validateStudent(req, true); err != nil {
		return nil, err
	}

	exists, err := s.auth.UsernameExists(ctx, req.Username)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, fmt.Errorf("%w: username %s already exists", ErrValidation, req.Username)
	}

	roleID, err := s.auth.MustRoleID(ctx, "Student")
	if err != nil {
		return nil, err
	}

	var result map[string]any
	err = s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		person := models.Person{
			FullName:    req.FullName,
			DateOfBirth: req.DateOfBirth,
			Phone:       req.Phone,
			Address:     req.Address,
			Email:       req.Email,
			Base:        models.Base{IsActive: req.IsActive},
		}
		if err := tx.Create(&person).Error; err != nil {
			return err
		}

		groupID, err := uuid.Parse(req.GroupID)
		if err != nil {
			return fmt.Errorf("%w: groupId is invalid", ErrValidation)
		}
		var group models.Group
		if err := ensureExists(ctx, tx, &group, groupID, "groupId"); err != nil {
			return err
		}

		if err := tx.Create(&models.StudentProfile{PersonID: person.ID, GroupID: groupID}).Error; err != nil {
			return err
		}

		hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		if err := tx.Create(&models.User{
			PersonID:     person.ID,
			RoleID:       mustUUID(roleID),
			Username:     req.Username,
			PasswordHash: string(hash),
			Base:         models.Base{IsActive: req.IsActive},
		}).Error; err != nil {
			return err
		}

		row, err := getStudentRow(ctx, tx, person.ID.String())
		if err != nil {
			return err
		}
		result, err = toMap(row)
		return err
	})
	return result, err
}

func (s *StudentService) Update(ctx context.Context, id string, req StudentUpsertRequest) (map[string]any, error) {
	if err := validateStudent(req, false); err != nil {
		return nil, err
	}
	personID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("%w: id is invalid", ErrValidation)
	}

	exists, err := s.auth.UsernameExists(ctx, req.Username, id)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, fmt.Errorf("%w: username %s already exists", ErrValidation, req.Username)
	}

	var result map[string]any
	err = s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var person models.Person
		if err := tx.First(&person, "id = ?", personID).Error; err != nil {
			return err
		}
		person.FullName = req.FullName
		person.DateOfBirth = req.DateOfBirth
		person.Phone = req.Phone
		person.Address = req.Address
		person.Email = req.Email
		person.IsActive = req.IsActive
		if err := tx.Save(&person).Error; err != nil {
			return err
		}

		var profile models.StudentProfile
		if err := tx.First(&profile, "person_id = ?", personID).Error; err != nil {
			return err
		}
		groupID, err := uuid.Parse(req.GroupID)
		if err != nil {
			return fmt.Errorf("%w: groupId is invalid", ErrValidation)
		}
		profile.GroupID = groupID
		profile.IsActive = req.IsActive
		if err := tx.Save(&profile).Error; err != nil {
			return err
		}

		var user models.User
		if err := tx.First(&user, "person_id = ?", personID).Error; err != nil {
			return err
		}
		user.Username = req.Username
		user.IsActive = req.IsActive
		if strings.TrimSpace(req.Password) != "" {
			hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
			if err != nil {
				return err
			}
			user.PasswordHash = string(hash)
		}
		if err := tx.Save(&user).Error; err != nil {
			return err
		}

		row, err := getStudentRow(ctx, tx, personID.String())
		if err != nil {
			return err
		}
		result, err = toMap(row)
		return err
	})
	return result, err
}

func (s *StudentService) Delete(ctx context.Context, id string) error {
	personID, err := uuid.Parse(id)
	if err != nil {
		return fmt.Errorf("%w: id is invalid", ErrValidation)
	}
	return s.db.WithContext(ctx).Delete(&models.Person{}, "id = ?", personID).Error
}

func (s *StudentService) Options(ctx context.Context) ([]models.OptionItem, error) {
	return listStudentOptions(ctx, s.db)
}

func (s *TeacherService) List(ctx context.Context, search string, page, pageSize int) (models.PageResult, error) {
	return listTeacherRows(ctx, s.db, search, page, pageSize)
}

func (s *TeacherService) Get(ctx context.Context, id string) (map[string]any, error) {
	row, err := getTeacherRow(ctx, s.db, id)
	if err != nil {
		return nil, err
	}
	return toMap(row)
}

func (s *TeacherService) Create(ctx context.Context, req TeacherUpsertRequest) (map[string]any, error) {
	if err := validateTeacher(req, true); err != nil {
		return nil, err
	}

	exists, err := s.auth.UsernameExists(ctx, req.Username)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, fmt.Errorf("%w: username %s already exists", ErrValidation, req.Username)
	}

	roleID, err := s.auth.MustRoleID(ctx, "Instructor")
	if err != nil {
		return nil, err
	}

	var result map[string]any
	err = s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		person := models.Person{
			FullName:    req.FullName,
			DateOfBirth: req.DateOfBirth,
			Phone:       req.Phone,
			Address:     req.Address,
			Email:       req.Email,
			Base:        models.Base{IsActive: req.IsActive},
		}
		if err := tx.Create(&person).Error; err != nil {
			return err
		}
		if err := tx.Create(&models.StaffProfile{
			PersonID:      person.ID,
			ScienceDegree: req.ScienceDegree,
			ScienceRank:   req.ScienceRank,
			Occupation:    req.Occupation,
			Audit:         models.Audit{IsActive: req.IsActive},
		}).Error; err != nil {
			return err
		}
		hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		if err := tx.Create(&models.User{
			PersonID:     person.ID,
			RoleID:       mustUUID(roleID),
			Username:     req.Username,
			PasswordHash: string(hash),
			Base:         models.Base{IsActive: req.IsActive},
		}).Error; err != nil {
			return err
		}
		row, err := getTeacherRow(ctx, tx, person.ID.String())
		if err != nil {
			return err
		}
		result, err = toMap(row)
		return err
	})
	return result, err
}

func (s *TeacherService) Update(ctx context.Context, id string, req TeacherUpsertRequest) (map[string]any, error) {
	if err := validateTeacher(req, false); err != nil {
		return nil, err
	}
	personID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("%w: id is invalid", ErrValidation)
	}

	exists, err := s.auth.UsernameExists(ctx, req.Username, id)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, fmt.Errorf("%w: username %s already exists", ErrValidation, req.Username)
	}

	var result map[string]any
	err = s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var person models.Person
		if err := tx.First(&person, "id = ?", personID).Error; err != nil {
			return err
		}
		person.FullName = req.FullName
		person.DateOfBirth = req.DateOfBirth
		person.Phone = req.Phone
		person.Address = req.Address
		person.Email = req.Email
		person.IsActive = req.IsActive
		if err := tx.Save(&person).Error; err != nil {
			return err
		}

		var profile models.StaffProfile
		if err := tx.First(&profile, "person_id = ?", personID).Error; err != nil {
			return err
		}
		profile.ScienceDegree = req.ScienceDegree
		profile.ScienceRank = req.ScienceRank
		profile.Occupation = req.Occupation
		profile.IsActive = req.IsActive
		if err := tx.Save(&profile).Error; err != nil {
			return err
		}

		var user models.User
		if err := tx.First(&user, "person_id = ?", personID).Error; err != nil {
			return err
		}
		user.Username = req.Username
		user.IsActive = req.IsActive
		if strings.TrimSpace(req.Password) != "" {
			hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
			if err != nil {
				return err
			}
			user.PasswordHash = string(hash)
		}
		if err := tx.Save(&user).Error; err != nil {
			return err
		}

		row, err := getTeacherRow(ctx, tx, personID.String())
		if err != nil {
			return err
		}
		result, err = toMap(row)
		return err
	})
	return result, err
}

func (s *TeacherService) Delete(ctx context.Context, id string) error {
	personID, err := uuid.Parse(id)
	if err != nil {
		return fmt.Errorf("%w: id is invalid", ErrValidation)
	}
	return s.db.WithContext(ctx).Delete(&models.Person{}, "id = ?", personID).Error
}

func (s *TeacherService) Options(ctx context.Context) ([]models.OptionItem, error) {
	return listTeacherOptions(ctx, s.db)
}

func validateStudent(req StudentUpsertRequest, requirePassword bool) error {
	if err := requireString(req.FullName, "fullName"); err != nil {
		return err
	}
	if err := requireString(req.GroupID, "groupId"); err != nil {
		return err
	}
	if err := requireString(req.Username, "username"); err != nil {
		return err
	}
	if requirePassword {
		if err := requireString(req.Password, "password"); err != nil {
			return err
		}
	}
	return nil
}

func validateTeacher(req TeacherUpsertRequest, requirePassword bool) error {
	if err := requireString(req.FullName, "fullName"); err != nil {
		return err
	}
	if err := requireString(req.Username, "username"); err != nil {
		return err
	}
	if requirePassword {
		if err := requireString(req.Password, "password"); err != nil {
			return err
		}
	}
	return nil
}

func listStudentRows(ctx context.Context, db *gorm.DB, search string, page, pageSize int) (models.PageResult, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}

	query := db.WithContext(ctx).Table("person").
		Joins("JOIN student_profile ON student_profile.person_id = person.id").
		Joins(`JOIN "group" ON "group".id = student_profile.group_id`).
		Joins("LEFT JOIN users ON users.person_id = person.id").
		Joins("LEFT JOIN role ON role.id = users.role_id")
	if trimmed := strings.TrimSpace(search); trimmed != "" {
		pattern := "%" + strings.ToLower(trimmed) + "%"
		query = query.Where(
			`LOWER(person.full_name) LIKE ? OR LOWER(person.email) LIKE ? OR LOWER("group".name) LIKE ? OR LOWER(users.username) LIKE ?`,
			pattern, pattern, pattern, pattern,
		)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return models.PageResult{}, err
	}

	var rows []StudentRow
	if err := query.Select(`
		person.id as person_id,
		person.full_name,
		person.date_of_birth,
		person.phone,
		person.address,
		person.email,
		student_profile.group_id,
		"group".name as group_name,
		users.username,
		role.name as role_name,
		person.is_active
	`).Order("person.created_at desc").Offset((page - 1) * pageSize).Limit(pageSize).Scan(&rows).Error; err != nil {
		return models.PageResult{}, err
	}

	return rowsToPage(rows, page, pageSize, total)
}

func listTeacherRows(ctx context.Context, db *gorm.DB, search string, page, pageSize int) (models.PageResult, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}

	query := db.WithContext(ctx).Table("person").
		Joins("JOIN staff_profile ON staff_profile.person_id = person.id").
		Joins("LEFT JOIN users ON users.person_id = person.id").
		Joins("LEFT JOIN role ON role.id = users.role_id")
	if trimmed := strings.TrimSpace(search); trimmed != "" {
		pattern := "%" + strings.ToLower(trimmed) + "%"
		query = query.Where(
			"LOWER(person.full_name) LIKE ? OR LOWER(person.email) LIKE ? OR LOWER(users.username) LIKE ? OR LOWER(staff_profile.occupation) LIKE ?",
			pattern, pattern, pattern, pattern,
		)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return models.PageResult{}, err
	}

	var rows []TeacherRow
	if err := query.Select(`
		person.id as person_id,
		person.full_name,
		person.date_of_birth,
		person.phone,
		person.address,
		person.email,
		staff_profile.science_degree,
		staff_profile.science_rank,
		staff_profile.occupation,
		users.username,
		role.name as role_name,
		person.is_active
	`).Order("person.created_at desc").Offset((page - 1) * pageSize).Limit(pageSize).Scan(&rows).Error; err != nil {
		return models.PageResult{}, err
	}

	return rowsToPage(rows, page, pageSize, total)
}

func getStudentRow(ctx context.Context, db *gorm.DB, id string) (*StudentRow, error) {
	var row StudentRow
	if err := db.WithContext(ctx).Table("person").
		Joins("JOIN student_profile ON student_profile.person_id = person.id").
		Joins(`JOIN "group" ON "group".id = student_profile.group_id`).
		Joins("LEFT JOIN users ON users.person_id = person.id").
		Joins("LEFT JOIN role ON role.id = users.role_id").
		Where("person.id = ?", id).
		Select(`
			person.id as person_id,
			person.full_name,
			person.date_of_birth,
			person.phone,
			person.address,
			person.email,
			student_profile.group_id,
			"group".name as group_name,
			users.username,
			role.name as role_name,
			person.is_active
		`).Scan(&row).Error; err != nil {
		return nil, err
	}
	if row.PersonID == "" {
		return nil, ErrNotFound
	}
	return &row, nil
}

func getTeacherRow(ctx context.Context, db *gorm.DB, id string) (*TeacherRow, error) {
	var row TeacherRow
	if err := db.WithContext(ctx).Table("person").
		Joins("JOIN staff_profile ON staff_profile.person_id = person.id").
		Joins("LEFT JOIN users ON users.person_id = person.id").
		Joins("LEFT JOIN role ON role.id = users.role_id").
		Where("person.id = ?", id).
		Select(`
			person.id as person_id,
			person.full_name,
			person.date_of_birth,
			person.phone,
			person.address,
			person.email,
			staff_profile.science_degree,
			staff_profile.science_rank,
			staff_profile.occupation,
			users.username,
			role.name as role_name,
			person.is_active
		`).Scan(&row).Error; err != nil {
		return nil, err
	}
	if row.PersonID == "" {
		return nil, ErrNotFound
	}
	return &row, nil
}

func listStudentOptions(ctx context.Context, db *gorm.DB) ([]models.OptionItem, error) {
	var rows []StudentRow
	if err := db.WithContext(ctx).Table("person").
		Joins("JOIN student_profile ON student_profile.person_id = person.id").
		Order("person.full_name asc").
		Select("person.id as person_id, person.full_name").
		Scan(&rows).Error; err != nil {
		return nil, err
	}
	options := make([]models.OptionItem, 0, len(rows))
	for _, row := range rows {
		options = append(options, models.OptionItem{ID: row.PersonID, Label: row.FullName})
	}
	return options, nil
}

func listTeacherOptions(ctx context.Context, db *gorm.DB) ([]models.OptionItem, error) {
	var rows []TeacherRow
	if err := db.WithContext(ctx).Table("person").
		Joins("JOIN staff_profile ON staff_profile.person_id = person.id").
		Order("person.full_name asc").
		Select("person.id as person_id, person.full_name").
		Scan(&rows).Error; err != nil {
		return nil, err
	}
	options := make([]models.OptionItem, 0, len(rows))
	for _, row := range rows {
		options = append(options, models.OptionItem{ID: row.PersonID, Label: row.FullName})
	}
	return options, nil
}

func rowsToPage[T any](rows []T, page, pageSize int, total int64) (models.PageResult, error) {
	items := make([]map[string]any, 0, len(rows))
	for _, row := range rows {
		item, err := toMap(row)
		if err != nil {
			return models.PageResult{}, err
		}
		items = append(items, item)
	}
	return models.PageResult{Items: items, Page: page, PageSize: pageSize, Total: total}, nil
}

func mustUUID(id string) uuid.UUID {
	parsed, _ := uuid.Parse(id)
	return parsed
}

func toStudentRequest(payload map[string]any) StudentUpsertRequest {
	var req StudentUpsertRequest
	_ = decodePayload(payload, &req)
	req.GroupID = stringValue(payload["groupId"])
	req.Username = stringValue(payload["username"])
	req.Password = stringValue(payload["password"])
	req.FullName = stringValue(payload["fullName"])
	req.Phone = stringValue(payload["phone"])
	req.Address = stringValue(payload["address"])
	req.Email = stringValue(payload["email"])
	req.IsActive = boolValue(payload["isActive"])
	return req
}

func toTeacherRequest(payload map[string]any) TeacherUpsertRequest {
	var req TeacherUpsertRequest
	_ = decodePayload(payload, &req)
	req.Username = stringValue(payload["username"])
	req.Password = stringValue(payload["password"])
	req.FullName = stringValue(payload["fullName"])
	req.Phone = stringValue(payload["phone"])
	req.Address = stringValue(payload["address"])
	req.Email = stringValue(payload["email"])
	req.ScienceDegree = stringValue(payload["scienceDegree"])
	req.ScienceRank = stringValue(payload["scienceRank"])
	req.Occupation = stringValue(payload["occupation"])
	req.IsActive = boolValue(payload["isActive"])
	return req
}

func boolValue(v any) bool {
	switch t := v.(type) {
	case bool:
		return t
	case string:
		return strings.EqualFold(t, "true")
	case float64:
		return t != 0
	default:
		return false
	}
}
