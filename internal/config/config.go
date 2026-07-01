package config

import (
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL       string
	SessionDuration   time.Duration
	SeedAdminUser     string
	SeedAdminPassword string
	LogLevel          string
}

func Load() Config {
	_ = godotenv.Load(".env", filepath.Join("..", ".env"))

	return Config{
		DatabaseURL:       buildDatabaseURL(),
		SessionDuration:   mustDuration(getenv("SESSION_DURATION_HOURS", "24") + "h"),
		SeedAdminUser:     getenv("SEED_ADMIN_USER", "admin"),
		SeedAdminPassword: getenv("SEED_ADMIN_PASSWORD", "admin123"),
		LogLevel:          getenv("LOG_LEVEL", "info"),
	}
}

func getenv(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}

func buildDatabaseURL() string {
	if url := strings.TrimSpace(os.Getenv("DATABASE_URL")); url != "" {
		return url
	}

	host := getenv("DB_HOST", "127.0.0.1")
	user := getenv("DB_USER", "postgres")
	password := getenv("DB_PASSWORD", "postgres")
	name := getenv("DB_NAME", "university_records")
	port := getenv("DB_PORT", "5433")
	sslmode := getenv("DB_SSLMODE", "disable")
	timeZone := getenv("DB_TIMEZONE", "Asia/Tashkent")

	return fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=%s",
		host, user, password, name, port, sslmode, timeZone,
	)
}

func mustDuration(raw string) time.Duration {
	d, err := time.ParseDuration(raw)
	if err != nil {
		hours, convErr := strconv.Atoi(strings.TrimSuffix(raw, "h"))
		if convErr != nil {
			panic(fmt.Errorf("invalid duration %q: %w", raw, err))
		}
		return time.Duration(hours) * time.Hour
	}
	return d
}
