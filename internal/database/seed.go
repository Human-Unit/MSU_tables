package database

import (
	"context"
	"fmt"
	"time"

	"UniversityAcademicRecordsSystem/internal/models"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func Seed(ctx context.Context, db *gorm.DB, adminUsername, adminPassword string) error {
	// Populate a small, self-consistent dataset so the weekly schedule grid has
	// something to show on a fresh database. Failures here must not block startup.
	if err := seedScheduleDemo(ctx, db); err != nil {
		fmt.Println("schedule demo seed skipped:", err)
	}
	// Attendance lives on a schema-sensitive table (day/sign columns are added by
	// AutoMigrate, which runs after the SQL migrations), so it is seeded here in
	// Go against the students created by the init_mock_data migration.
	if err := seedAttendanceDemo(ctx, db); err != nil {
		fmt.Println("attendance demo seed skipped:", err)
	}

	roleNames := []string{"Admin", "Instructor", "Student"}
	roles := make(map[string]models.Role, len(roleNames))

	for _, name := range roleNames {
		var role models.Role
		err := db.WithContext(ctx).Where("name = ?", name).First(&role).Error
		if err == nil {
			roles[name] = role
			continue
		}
		role = models.Role{Name: name}
		if err := db.WithContext(ctx).Create(&role).Error; err != nil {
			return fmt.Errorf("seed role %s: %w", name, err)
		}
		roles[name] = role
	}

	var adminPerson models.Person
	if err := db.WithContext(ctx).Where("email = ?", "admin@university.local").First(&adminPerson).Error; err != nil {
		adminPerson = models.Person{
			FullName: "System Admin",
			Email:    "admin@university.local",
			Base:     models.Base{IsActive: true},
		}
		if err := db.WithContext(ctx).Create(&adminPerson).Error; err != nil {
			return fmt.Errorf("seed admin person: %w", err)
		}
	}

	var existing models.User
	if err := db.WithContext(ctx).Where("username = ?", adminUsername).First(&existing).Error; err == nil {
		return nil
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(adminPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("hash admin password: %w", err)
	}

	admin := models.User{
		PersonID:     adminPerson.ID,
		RoleID:       roles["Admin"].ID,
		Username:     adminUsername,
		PasswordHash: string(hash),
	}
	if err := db.WithContext(ctx).Create(&admin).Error; err != nil {
		return fmt.Errorf("seed admin user: %w", err)
	}

	return nil
}

// seedScheduleDemo creates a compact, self-consistent dataset (faculty ->
// vocations -> groups + subjects, teachers, auditoriums and a weekly schedule)
// so the weekly-schedule grid is populated on a fresh database. Every step is
// idempotent, so it is safe to run on every startup.
func seedScheduleDemo(ctx context.Context, db *gorm.DB) error {
	tx := db.WithContext(ctx)

	faculty := models.Faculty{}
	if err := tx.Where(models.Faculty{Name: "Факультет математики и информатики"}).
		FirstOrCreate(&faculty).Error; err != nil {
		return err
	}

	voc1 := models.Vocation{}
	if err := tx.Where(models.Vocation{Name: "Прикладная математика и информатика"}).
		FirstOrCreate(&voc1).Error; err != nil {
		return err
	}
	if voc1.FacultyID == nil {
		voc1.FacultyID = &faculty.ID
		if err := tx.Save(&voc1).Error; err != nil {
			return err
		}
	}

	voc2 := models.Vocation{}
	if err := tx.Where(models.Vocation{Name: "Программная инженерия"}).
		Attrs(models.Vocation{FacultyID: &faculty.ID}).
		FirstOrCreate(&voc2).Error; err != nil {
		return err
	}

	// Groups: two courses for voc1 and one for voc2.
	groupPMI1 := models.Group{}
	if err := tx.Where(models.Group{Name: "ПМИ-101"}).
		Attrs(models.Group{VocationID: voc1.ID, EducationYear: 1}).
		FirstOrCreate(&groupPMI1).Error; err != nil {
		return err
	}
	groupPMI2 := models.Group{}
	if err := tx.Where(models.Group{Name: "ПМИ-201"}).
		Attrs(models.Group{VocationID: voc1.ID, EducationYear: 2}).
		FirstOrCreate(&groupPMI2).Error; err != nil {
		return err
	}
	groupPI1 := models.Group{}
	if err := tx.Where(models.Group{Name: "ПИ-101"}).
		Attrs(models.Group{VocationID: voc2.ID, EducationYear: 1}).
		FirstOrCreate(&groupPI1).Error; err != nil {
		return err
	}

	// Subjects.
	subjects := map[string]*models.Subject{
		"Математический анализ": {Semester: 1, QuantityOfHours: 108, CreditsECTS: 4, FormOfControl: "Экзамен"},
		"Программирование":      {Semester: 1, QuantityOfHours: 90, CreditsECTS: 3, FormOfControl: "Экзамен"},
		"Физика":                {Semester: 1, QuantityOfHours: 72, CreditsECTS: 3, FormOfControl: "Зачет"},
		"Дискретная математика": {Semester: 2, QuantityOfHours: 72, CreditsECTS: 3, FormOfControl: "Зачет"},
	}
	subjectID := map[string]uuid.UUID{}
	for name, attrs := range subjects {
		s := models.Subject{}
		if err := tx.Where(models.Subject{Name: name}).Attrs(*attrs).FirstOrCreate(&s).Error; err != nil {
			return err
		}
		subjectID[name] = s.ID
	}

	// Teachers (person + staff profile + user for login).
	teacherID := map[string]uuid.UUID{}
	teachers := []struct {
		name, email, occupation string
		username, password      string
	}{
		{"Каримов Рустам", "karimov.r@demo.edu", "Доцент", "karimov", "demo"},
		{"Смирнова Ольга", "smirnova.o@demo.edu", "Старший преподаватель", "smirnova", "demo"},
	}
	for _, t := range teachers {
		p := models.Person{}
		if err := tx.Where(models.Person{Email: t.email}).
			Attrs(models.Person{FullName: t.name}).
			FirstOrCreate(&p).Error; err != nil {
			return err
		}
		profile := models.StaffProfile{}
		if err := tx.Where(models.StaffProfile{PersonID: p.ID}).
			Attrs(models.StaffProfile{Occupation: t.occupation}).
			FirstOrCreate(&profile).Error; err != nil {
			return err
		}

		// Create a user account so demo teachers can log in.
		var role models.Role
		if err := tx.Where("name = ?", "Instructor").First(&role).Error; err != nil {
			return err
		}
		existingUser := models.User{}
		if err := tx.Where("username = ?", t.username).First(&existingUser).Error; err != nil {
			hash, err := bcrypt.GenerateFromPassword([]byte(t.password), bcrypt.DefaultCost)
			if err != nil {
				return err
			}
			user := models.User{
				PersonID:     p.ID,
				RoleID:       role.ID,
				Username:     t.username,
				PasswordHash: string(hash),
			}
			if err := tx.Create(&user).Error; err != nil {
				return err
			}
		}
		teacherID[t.name] = p.ID
	}

	// Auditoriums.
	auditoriumID := map[string]uuid.UUID{}
	auditoriums := []struct {
		number string
		typ    models.AuditoriumType
	}{
		{"201", models.AuditoriumLecture},
		{"305", models.AuditoriumPractice},
		{"410", models.AuditoriumFlow},
	}
	for _, a := range auditoriums {
		au := models.Auditorium{}
		if err := tx.Where(models.Auditorium{Number: a.number}).
			Attrs(models.Auditorium{Type: a.typ}).
			FirstOrCreate(&au).Error; err != nil {
			return err
		}
		auditoriumID[a.number] = au.ID
	}

	// Weekly schedule slots (weekday 1=Mon .. 6=Sat, pair 1..8).
	aud201 := auditoriumID["201"]
	aud305 := auditoriumID["305"]
	type slot struct {
		group      uuid.UUID
		weekday    int
		pair       int
		subject    string
		teacher    string
		auditorium uuid.UUID
		lesson     models.LessonType
	}
	slots := []slot{
		{groupPMI1.ID, 1, 1, "Математический анализ", "Каримов Рустам", aud201, models.LessonLecture},
		{groupPMI1.ID, 1, 2, "Программирование", "Смирнова Ольга", aud305, models.LessonPractice},
		{groupPMI1.ID, 2, 2, "Физика", "Каримов Рустам", aud201, models.LessonLecture},
		{groupPMI1.ID, 3, 1, "Математический анализ", "Каримов Рустам", aud305, models.LessonPractice},
		{groupPMI1.ID, 3, 3, "Дискретная математика", "Смирнова Ольга", aud201, models.LessonLecture},
		{groupPMI1.ID, 5, 2, "Программирование", "Смирнова Ольга", aud305, models.LessonLab},
		{groupPMI2.ID, 1, 3, "Дискретная математика", "Смирнова Ольга", aud201, models.LessonLecture},
		{groupPMI2.ID, 2, 1, "Физика", "Каримов Рустам", aud305, models.LessonPractice},
		{groupPMI2.ID, 4, 2, "Математический анализ", "Каримов Рустам", aud201, models.LessonLecture},
		{groupPI1.ID, 1, 1, "Программирование", "Смирнова Ольга", aud201, models.LessonLecture},
		{groupPI1.ID, 2, 2, "Дискретная математика", "Каримов Рустам", aud305, models.LessonPractice},
		{groupPI1.ID, 4, 3, "Программирование", "Смирнова Ольга", aud305, models.LessonLab},
	}
	for _, sl := range slots {
		aud := sl.auditorium
		record := models.Schedule{}
		if err := tx.Where(models.Schedule{GroupID: sl.group, Weekday: sl.weekday, Pair: sl.pair}).
			Attrs(models.Schedule{
				SubjectID:    subjectID[sl.subject],
				TeacherID:    teacherID[sl.teacher],
				AuditoriumID: &aud,
				TypeOfLesson: sl.lesson,
			}).
			FirstOrCreate(&record).Error; err != nil {
			return err
		}
	}

	return nil
}

// seedAttendanceDemo attaches a few attendance rows to the first handful of
// students so the Attendance module is populated. It is idempotent: rows are
// keyed by (student, day, pair) with fixed demo dates, so re-runs are no-ops.
func seedAttendanceDemo(ctx context.Context, db *gorm.DB) error {
	tx := db.WithContext(ctx)

	var students []models.StudentProfile
	if err := tx.Order("created_at asc").Limit(6).Find(&students).Error; err != nil {
		return err
	}
	if len(students) == 0 {
		return nil
	}

	// Two fixed lesson days keep the seed deterministic across restarts.
	day1 := time.Date(2026, time.September, 1, 0, 0, 0, 0, time.UTC)
	day2 := time.Date(2026, time.September, 2, 0, 0, 0, 0, time.UTC)

	type slot struct {
		day  time.Time
		pair int
	}
	slots := []slot{{day1, 1}, {day1, 2}, {day2, 1}}

	for i, sp := range students {
		// Pick a discipline for the student's group so attendance is properly linked.
		var disciplines []models.Discipline
		if err := tx.Where("group_id = ?", sp.GroupID).Order("created_at asc").Limit(2).Find(&disciplines).Error; err != nil {
			return err
		}
		for j, sl := range slots {
			// Cycle through available disciplines; use a predictable pattern.
			if len(disciplines) == 0 {
				continue
			}
			disc := disciplines[(i+j)%len(disciplines)]
			// Mark most sessions present, with a predictable absence pattern.
			status := models.AttendancePresent
			if (i+j)%4 == 0 {
				status = models.AttendanceAbsent
			} else if (i+j)%5 == 0 {
				status = models.AttendanceLate
			}
			record := models.Attendance{}
			if err := tx.Where(models.Attendance{StudentID: sp.PersonID, DisciplineID: disc.ID, Day: sl.day, Pair: sl.pair}).
				Attrs(models.Attendance{Status: status}).
				FirstOrCreate(&record).Error; err != nil {
				return err
			}
		}
	}

	return nil
}
