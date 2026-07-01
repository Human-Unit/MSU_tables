package services

import "errors"

var (
	ErrNotFound   = errors.New("record not found")
	ErrValidation = errors.New("validation failed")
	ErrAuth       = errors.New("invalid username or password")
)
