package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"reflect"
	"strconv"
	"strings"

	"UniversityAcademicRecordsSystem/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SimpleModule struct {
	Name          string
	SearchColumns []string
	Preloads      []string
	OptionsLabel  func(map[string]any) string
	Validate      func(context.Context, *gorm.DB, map[string]any, bool) error
	New           func() any
}

type SimpleModuleService struct {
	db      *gorm.DB
	modules map[string]SimpleModule
}

func NewSimpleModuleService(db *gorm.DB) *SimpleModuleService {
	s := &SimpleModuleService{db: db, modules: map[string]SimpleModule{}}
	s.registerModules()
	return s
}

func (s *SimpleModuleService) registerModules() {
	s.modules["faculty"] = simpleModule(
		"faculty",
		[]string{"name"},
		nil,
		func(item map[string]any) string { return stringValue(item["name"]) },
		func(_ context.Context, _ *gorm.DB, data map[string]any, _ bool) error {
			return requireString(stringValue(data["name"]), "name")
		},
		func() any { return &models.Faculty{} },
	)
	s.modules["vocation"] = simpleModule(
		"vocation",
		[]string{"name"},
		[]string{"Faculty"},
		func(item map[string]any) string { return stringValue(item["name"]) },
		func(ctx context.Context, db *gorm.DB, data map[string]any, _ bool) error {
			if err := requireString(stringValue(data["name"]), "name"); err != nil {
				return err
			}
			if facultyID := uuidValue(data["facultyId"]); facultyID != uuid.Nil {
				return ensureExists(ctx, db, &models.Faculty{}, facultyID, "facultyId")
			}
			return nil
		},
		func() any { return &models.Vocation{} },
	)
	s.modules["group"] = simpleModule(
		"group",
		[]string{"name"},
		[]string{"Vocation"},
		func(item map[string]any) string { return stringValue(item["name"]) },
		func(ctx context.Context, db *gorm.DB, data map[string]any, _ bool) error {
			if err := requireString(stringValue(data["name"]), "name"); err != nil {
				return err
			}
			if err := requirePositiveInt(intValue(data["educationYear"]), "educationYear"); err != nil {
				return err
			}
			return ensureExists(ctx, db, &models.Vocation{}, uuidValue(data["vocationId"]), "vocationId")
		},
		func() any { return &models.Group{} },
	)
	s.modules["auditorium"] = simpleModule(
		"auditorium",
		[]string{"number"},
		nil,
		func(item map[string]any) string { return stringValue(item["number"]) },
		func(_ context.Context, _ *gorm.DB, data map[string]any, _ bool) error {
			if err := requireString(stringValue(data["number"]), "number"); err != nil {
				return err
			}
			return models.AuditoriumType(stringValue(data["type"])).Valid()
		},
		func() any { return &models.Auditorium{} },
	)
	s.modules["subject"] = simpleModule(
		"subject",
		[]string{"name"},
		nil,
		func(item map[string]any) string { return stringValue(item["name"]) },
		func(_ context.Context, _ *gorm.DB, data map[string]any, _ bool) error {
			if err := requireString(stringValue(data["name"]), "name"); err != nil {
				return err
			}
			if err := requirePositiveInt(intValue(data["semester"]), "semester"); err != nil {
				return err
			}
			if err := requirePositiveInt(intValue(data["quantityOfHours"]), "quantityOfHours"); err != nil {
				return err
			}
			return requireString(stringValue(data["formOfControl"]), "formOfControl")
		},
		func() any { return &models.Subject{} },
	)
	s.modules["discipline"] = simpleModule(
		"discipline",
		[]string{"subject_id"},
		[]string{"Subject", "Teacher", "Group"},
		func(item map[string]any) string { return nestedString(item, "subject", "name") },
		func(ctx context.Context, db *gorm.DB, data map[string]any, _ bool) error {
			if err := ensureExists(ctx, db, &models.Subject{}, uuidValue(data["subjectId"]), "subjectId"); err != nil {
				return err
			}
			if err := ensureExists(ctx, db, &models.Person{}, uuidValue(data["teacherId"]), "teacherId"); err != nil {
				return err
			}
			if err := ensureExists(ctx, db, &models.Group{}, uuidValue(data["groupId"]), "groupId"); err != nil {
				return err
			}
			if err := requireNonNegativeInt(intValue(data["quantityOfLectures"]), "quantityOfLectures"); err != nil {
				return err
			}
			if err := requireNonNegativeInt(intValue(data["quantityOfPracticalLessons"]), "quantityOfPracticalLessons"); err != nil {
				return err
			}
			if err := requireNonNegativeInt(intValue(data["quantityOfLabWorks"]), "quantityOfLabWorks"); err != nil {
				return err
			}
			if err := requireNonNegativeInt(intValue(data["otherWorks"]), "otherWorks"); err != nil {
				return err
			}
			return requireNonNegativeInt(intValue(data["selfControl"]), "selfControl")
		},
		func() any { return &models.Discipline{} },
	)
	s.modules["week"] = simpleModule(
		"week",
		[]string{"name"},
		nil,
		func(item map[string]any) string { return stringValue(item["name"]) },
		func(_ context.Context, _ *gorm.DB, data map[string]any, _ bool) error {
			return requireString(stringValue(data["name"]), "name")
		},
		func() any { return &models.Week{} },
	)
	s.modules["schedule"] = simpleModule(
		"schedule",
		[]string{"pair"},
		[]string{"Subject", "Teacher", "Auditorium", "Group"},
		func(item map[string]any) string { return nestedString(item, "subject", "name") },
		func(ctx context.Context, db *gorm.DB, data map[string]any, _ bool) error {
			if err := ensureExists(ctx, db, &models.Subject{}, uuidValue(data["subjectId"]), "subjectId"); err != nil {
				return err
			}
			if err := ensureExists(ctx, db, &models.Person{}, uuidValue(data["teacherId"]), "teacherId"); err != nil {
				return err
			}
			if err := ensureExists(ctx, db, &models.Group{}, uuidValue(data["groupId"]), "groupId"); err != nil {
				return err
			}
			if auditoriumID := uuidValue(data["auditoriumId"]); auditoriumID != uuid.Nil {
				if err := ensureExists(ctx, db, &models.Auditorium{}, auditoriumID, "auditoriumId"); err != nil {
					return err
				}
			}
			if err := models.LessonType(stringValue(data["typeOfLesson"])).Valid(); err != nil {
				return err
			}
			weekday := intValue(data["weekday"])
			if weekday < 1 || weekday > 6 {
				return fmt.Errorf("%w: weekday must be between 1 (Mon) and 6 (Sat)", ErrValidation)
			}
			pair := intValue(data["pair"])
			if pair < 1 || pair > 8 {
				return fmt.Errorf("%w: pair must be between 1 and 8", ErrValidation)
			}
			return nil
		},
		func() any { return &models.Schedule{} },
	)
	s.modules["attendance"] = simpleModule(
		"attendance",
		[]string{"pair"},
		[]string{"Student"},
		func(item map[string]any) string { return nestedString(item, "student", "fullName") },
		func(ctx context.Context, db *gorm.DB, data map[string]any, _ bool) error {
			if err := ensureExists(ctx, db, &models.Person{}, uuidValue(data["studentId"]), "studentId"); err != nil {
				return err
			}
			pair := intValue(data["pair"])
			if pair < 1 || pair > 8 {
				return fmt.Errorf("%w: pair must be between 1 and 8", ErrValidation)
			}
			return nil
		},
		func() any { return &models.Attendance{} },
	)
	s.modules["academic-performance"] = simpleModule(
		"academic-performance",
		[]string{"form_of_control"},
		[]string{"Student", "Discipline", "Discipline.Subject", "Teacher"},
		func(item map[string]any) string { return nestedString(item, "student", "fullName") },
		func(ctx context.Context, db *gorm.DB, data map[string]any, _ bool) error {
			if err := ensureExists(ctx, db, &models.Person{}, uuidValue(data["studentId"]), "studentId"); err != nil {
				return err
			}
			if err := ensureExists(ctx, db, &models.Discipline{}, uuidValue(data["disciplineId"]), "disciplineId"); err != nil {
				return err
			}
			if err := ensureExists(ctx, db, &models.Person{}, uuidValue(data["teacherId"]), "teacherId"); err != nil {
				return err
			}
			if err := models.FormOfControl(stringValue(data["formOfControl"])).Valid(); err != nil {
				return err
			}
			if tour := intValue(data["tour"]); tour < 1 {
				return fmt.Errorf("%w: tour must be greater than zero", ErrValidation)
			}
			sign := intValue(data["sign"])
			switch models.FormOfControl(stringValue(data["formOfControl"])) {
			case models.ControlTest:
				if sign < 0 || sign > 3 {
					return fmt.Errorf("%w: test sign must be between 0 and 3", ErrValidation)
				}
			case models.ControlExam:
				if sign < 1 || sign > 5 {
					return fmt.Errorf("%w: exam sign must be between 1 and 5", ErrValidation)
				}
			}
			return nil
		},
		func() any { return &models.AcademicPerformance{} },
	)
	s.modules["execution"] = simpleModule(
		"execution",
		nil,
		[]string{"Teacher", "Discipline", "Discipline.Subject"},
		func(item map[string]any) string { return nestedString(item, "teacher", "fullName") },
		func(ctx context.Context, db *gorm.DB, data map[string]any, _ bool) error {
			if err := ensureExists(ctx, db, &models.Person{}, uuidValue(data["teacherId"]), "teacherId"); err != nil {
				return err
			}
			if err := ensureExists(ctx, db, &models.Discipline{}, uuidValue(data["disciplineId"]), "disciplineId"); err != nil {
				return err
			}
			if err := requireNonNegativeInt(intValue(data["lectures"]), "lectures"); err != nil {
				return err
			}
			if err := requireNonNegativeInt(intValue(data["practices"]), "practices"); err != nil {
				return err
			}
			if err := requireNonNegativeInt(intValue(data["labWorks"]), "labWorks"); err != nil {
				return err
			}
			return requireNonNegativeInt(intValue(data["otherWorks"]), "otherWorks")
		},
		func() any { return &models.Execution{} },
	)
}

func simpleModule(
	name string,
	searchColumns []string,
	preloads []string,
	label func(map[string]any) string,
	validate func(context.Context, *gorm.DB, map[string]any, bool) error,
	newFn func() any,
) SimpleModule {
	return SimpleModule{
		Name:          name,
		SearchColumns: searchColumns,
		Preloads:      preloads,
		OptionsLabel:  label,
		Validate:      validate,
		New:           newFn,
	}
}

func (s *SimpleModuleService) List(ctx context.Context, module string, search string, page, pageSize int) (models.PageResult, error) {
	def, ok := s.modules[module]
	if !ok {
		return models.PageResult{}, fmt.Errorf("%w: unknown module %s", ErrValidation, module)
	}
	return listEntities(ctx, s.db, def, search, page, pageSize)
}

func (s *SimpleModuleService) Get(ctx context.Context, module string, id string) (map[string]any, error) {
	def, ok := s.modules[module]
	if !ok {
		return nil, fmt.Errorf("%w: unknown module %s", ErrValidation, module)
	}
	return getEntity(ctx, s.db, def, id)
}

func (s *SimpleModuleService) Create(ctx context.Context, module string, payload map[string]any) (map[string]any, error) {
	def, ok := s.modules[module]
	if !ok {
		return nil, fmt.Errorf("%w: unknown module %s", ErrValidation, module)
	}
	return saveEntity(ctx, s.db, def, payload, "", true)
}

func (s *SimpleModuleService) Update(ctx context.Context, module string, id string, payload map[string]any) (map[string]any, error) {
	def, ok := s.modules[module]
	if !ok {
		return nil, fmt.Errorf("%w: unknown module %s", ErrValidation, module)
	}
	return saveEntity(ctx, s.db, def, payload, id, false)
}

func (s *SimpleModuleService) Delete(ctx context.Context, module string, id string) error {
	def, ok := s.modules[module]
	if !ok {
		return fmt.Errorf("%w: unknown module %s", ErrValidation, module)
	}
	return deleteEntity(ctx, s.db, def, id)
}

func (s *SimpleModuleService) Options(ctx context.Context, module string) ([]models.OptionItem, error) {
	def, ok := s.modules[module]
	if !ok {
		return nil, fmt.Errorf("%w: unknown module %s", ErrValidation, module)
	}
	return listOptions(ctx, s.db, def)
}

func listEntities(ctx context.Context, db *gorm.DB, def SimpleModule, search string, page, pageSize int) (models.PageResult, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}

	query := db.WithContext(ctx).Model(def.New())
	for _, preload := range def.Preloads {
		query = query.Preload(preload)
	}
	if trimmed := strings.TrimSpace(search); trimmed != "" && len(def.SearchColumns) > 0 {
		pattern := "%" + strings.ToLower(trimmed) + "%"
		parts := make([]string, 0, len(def.SearchColumns))
		args := make([]any, 0, len(def.SearchColumns))
		for _, column := range def.SearchColumns {
			parts = append(parts, fmt.Sprintf("LOWER(%s) LIKE ?", column))
			args = append(args, pattern)
		}
		query = query.Where(strings.Join(parts, " OR "), args...)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return models.PageResult{}, err
	}

	itemType := reflect.TypeOf(def.New())
	slicePtr := reflect.New(reflect.SliceOf(itemType.Elem())).Interface()
	if err := query.Order("created_at desc").Offset((page - 1) * pageSize).Limit(pageSize).Find(slicePtr).Error; err != nil {
		return models.PageResult{}, err
	}

	value := reflect.ValueOf(slicePtr).Elem()
	items := make([]map[string]any, 0, value.Len())
	for i := 0; i < value.Len(); i++ {
		item, err := toMap(value.Index(i).Interface())
		if err != nil {
			return models.PageResult{}, err
		}
		items = append(items, item)
	}

	return models.PageResult{Items: items, Page: page, PageSize: pageSize, Total: total}, nil
}

func getEntity(ctx context.Context, db *gorm.DB, def SimpleModule, id string) (map[string]any, error) {
	query := db.WithContext(ctx).Model(def.New())
	for _, preload := range def.Preloads {
		query = query.Preload(preload)
	}
	itemType := reflect.TypeOf(def.New())
	itemPtr := reflect.New(itemType.Elem()).Interface()
	if err := query.First(itemPtr, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return toMap(itemPtr)
}

func saveEntity(ctx context.Context, db *gorm.DB, def SimpleModule, payload map[string]any, id string, isCreate bool) (map[string]any, error) {
	itemType := reflect.TypeOf(def.New())
	itemPtr := reflect.New(itemType.Elem()).Interface()
	if err := decodePayload(payload, itemPtr); err != nil {
		return nil, err
	}

	if id != "" {
		if err := setEntityID(itemPtr, id); err != nil {
			return nil, err
		}
	}

	if def.Validate != nil {
		if err := def.Validate(ctx, db, payload, isCreate); err != nil {
			return nil, err
		}
	}

	if isCreate {
		if err := db.WithContext(ctx).Create(itemPtr).Error; err != nil {
			return nil, fmt.Errorf("create failed: %w", err)
		}
	} else {
		if err := db.WithContext(ctx).Save(itemPtr).Error; err != nil {
			return nil, fmt.Errorf("update failed: %w", err)
		}
	}

	storedID, err := entityID(itemPtr)
	if err != nil {
		return nil, err
	}
	return getEntity(ctx, db, def, storedID)
}

func deleteEntity(ctx context.Context, db *gorm.DB, def SimpleModule, id string) error {
	itemType := reflect.TypeOf(def.New())
	itemPtr := reflect.New(itemType.Elem()).Interface()
	result := db.WithContext(ctx).Delete(itemPtr, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrNotFound
	}
	return nil
}

func listOptions(ctx context.Context, db *gorm.DB, def SimpleModule) ([]models.OptionItem, error) {
	query := db.WithContext(ctx).Model(def.New())
	for _, preload := range def.Preloads {
		query = query.Preload(preload)
	}
	slicePtr := reflect.New(reflect.SliceOf(reflect.TypeOf(def.New()).Elem())).Interface()
	if err := query.Order("created_at asc").Find(slicePtr).Error; err != nil {
		return nil, err
	}

	value := reflect.ValueOf(slicePtr).Elem()
	options := make([]models.OptionItem, 0, value.Len())
	for i := 0; i < value.Len(); i++ {
		item, err := toMap(value.Index(i).Interface())
		if err != nil {
			return nil, err
		}
		label := def.OptionsLabel(item)
		options = append(options, models.OptionItem{ID: stringValue(item["id"]), Label: label})
	}
	return options, nil
}

func setEntityID(target any, id string) error {
	value := reflect.ValueOf(target)
	if value.Kind() != reflect.Pointer {
		return fmt.Errorf("target must be a pointer")
	}
	elem := value.Elem()
	field := elem.FieldByName("ID")
	if !field.IsValid() || !field.CanSet() {
		return nil
	}
	parsed, err := uuid.Parse(id)
	if err != nil {
		return err
	}
	field.Set(reflect.ValueOf(parsed))
	return nil
}

func entityID(target any) (string, error) {
	value := reflect.ValueOf(target)
	if value.Kind() != reflect.Pointer {
		return "", fmt.Errorf("target must be a pointer")
	}
	elem := value.Elem()
	field := elem.FieldByName("ID")
	if !field.IsValid() {
		return "", fmt.Errorf("entity does not have an ID field")
	}
	id, ok := field.Interface().(uuid.UUID)
	if !ok {
		return "", fmt.Errorf("entity id is not a uuid")
	}
	return id.String(), nil
}

func stringValue(v any) string {
	if v == nil {
		return ""
	}
	switch t := v.(type) {
	case string:
		return t
	case fmt.Stringer:
		return t.String()
	default:
		return fmt.Sprint(v)
	}
}

func intValue(v any) int {
	switch t := v.(type) {
	case int:
		return t
	case int32:
		return int(t)
	case int64:
		return int(t)
	case float32:
		return int(t)
	case float64:
		return int(t)
	case json.Number:
		i, _ := t.Int64()
		return int(i)
	case string:
		i, _ := strconv.Atoi(t)
		return i
	default:
		return 0
	}
}

func uuidValue(v any) uuid.UUID {
	switch t := v.(type) {
	case uuid.UUID:
		return t
	case string:
		id, _ := uuid.Parse(t)
		return id
	default:
		return uuid.Nil
	}
}

func nestedString(item map[string]any, first, second string) string {
	if nested, ok := item[first].(map[string]any); ok {
		return stringValue(nested[second])
	}
	return ""
}
