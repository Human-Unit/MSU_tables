package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

func decodePayload(src map[string]any, target any) error {
	raw, err := json.Marshal(src)
	if err != nil {
		return err
	}
	return json.Unmarshal(raw, target)
}

func toMap(value any) (map[string]any, error) {
	raw, err := json.Marshal(value)
	if err != nil {
		return nil, err
	}
	var out map[string]any
	if err := json.Unmarshal(raw, &out); err != nil {
		return nil, err
	}
	return out, nil
}

func requireString(value string, field string) error {
	if strings.TrimSpace(value) == "" {
		return fmt.Errorf("%w: %s is required", ErrValidation, field)
	}
	return nil
}

func requirePositiveInt(value int, field string) error {
	if value <= 0 {
		return fmt.Errorf("%w: %s must be greater than zero", ErrValidation, field)
	}
	return nil
}

func requireNonNegativeInt(value int, field string) error {
	if value < 0 {
		return fmt.Errorf("%w: %s must not be negative", ErrValidation, field)
	}
	return nil
}

func requireUUID(value uuid.UUID, field string) error {
	if value == uuid.Nil {
		return fmt.Errorf("%w: %s is required", ErrValidation, field)
	}
	return nil
}

func ensureExists(ctx context.Context, db *gorm.DB, model any, id uuid.UUID, field string) error {
	if id == uuid.Nil {
		return fmt.Errorf("%w: %s is required", ErrValidation, field)
	}
	if err := db.WithContext(ctx).First(model, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return fmt.Errorf("%w: %s does not exist", ErrValidation, field)
		}
		return err
	}
	return nil
}
