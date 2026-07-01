package models

import "fmt"

type AuditoriumType string

const (
	AuditoriumLecture  AuditoriumType = "lecture"
	AuditoriumPractice AuditoriumType = "practice"
	AuditoriumFlow     AuditoriumType = "flow"
)

func (t AuditoriumType) Valid() error {
	switch t {
	case AuditoriumLecture, AuditoriumPractice, AuditoriumFlow:
		return nil
	default:
		return fmt.Errorf("invalid auditorium type: %s", t)
	}
}

type LessonType string

const (
	LessonLecture  LessonType = "lecture"
	LessonPractice LessonType = "practice"
	LessonLab      LessonType = "lab"
)

func (t LessonType) Valid() error {
	switch t {
	case LessonLecture, LessonPractice, LessonLab:
		return nil
	default:
		return fmt.Errorf("invalid lesson type: %s", t)
	}
}

type FormOfControl string

const (
	ControlExam FormOfControl = "exam"
	ControlTest FormOfControl = "test"
)

func (c FormOfControl) Valid() error {
	switch c {
	case ControlExam, ControlTest:
		return nil
	default:
		return fmt.Errorf("invalid form of control: %s", c)
	}
}
