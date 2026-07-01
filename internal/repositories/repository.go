package repositories

import (
	"context"
	"fmt"
	"strings"

	"gorm.io/gorm"
)

type Repository[T any] struct {
	db *gorm.DB
}

func New[T any](db *gorm.DB) *Repository[T] {
	return &Repository[T]{db: db}
}

func (r *Repository[T]) Create(ctx context.Context, value *T) error {
	return r.db.WithContext(ctx).Create(value).Error
}

func (r *Repository[T]) Save(ctx context.Context, value *T) error {
	return r.db.WithContext(ctx).Save(value).Error
}

func (r *Repository[T]) Delete(ctx context.Context, value *T) error {
	return r.db.WithContext(ctx).Delete(value).Error
}

func (r *Repository[T]) Get(ctx context.Context, id string, preloads ...string) (*T, error) {
	var value T
	query := r.db.WithContext(ctx).Model(new(T))
	for _, preload := range preloads {
		query = query.Preload(preload)
	}
	if err := query.First(&value, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &value, nil
}

func (r *Repository[T]) List(ctx context.Context, search string, page, pageSize int, searchColumns []string, preloads ...string) ([]T, int64, error) {
	query := r.db.WithContext(ctx).Model(new(T))
	for _, preload := range preloads {
		query = query.Preload(preload)
	}

	if trimmed := strings.TrimSpace(search); trimmed != "" && len(searchColumns) > 0 {
		pattern := "%" + strings.ToLower(trimmed) + "%"
		parts := make([]string, 0, len(searchColumns))
		args := make([]any, 0, len(searchColumns))
		for _, column := range searchColumns {
			parts = append(parts, fmt.Sprintf("LOWER(%s) LIKE ?", column))
			args = append(args, pattern)
		}
		query = query.Where(strings.Join(parts, " OR "), args...)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}

	var items []T
	if err := query.Offset((page - 1) * pageSize).Limit(pageSize).Order("created_at desc").Find(&items).Error; err != nil {
		return nil, 0, err
	}

	return items, total, nil
}

func (r *Repository[T]) FindOne(ctx context.Context, conditions string, args ...any) (*T, error) {
	var value T
	if err := r.db.WithContext(ctx).Where(conditions, args...).First(&value).Error; err != nil {
		return nil, err
	}
	return &value, nil
}
