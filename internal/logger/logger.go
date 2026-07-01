package logger

import (
	"log/slog"
	"os"
)

func New(level string) *slog.Logger {
	var handler slog.Handler

	opts := &slog.HandlerOptions{Level: slog.LevelInfo}
	switch level {
	case "debug":
		opts.Level = slog.LevelDebug
	case "warn":
		opts.Level = slog.LevelWarn
	case "error":
		opts.Level = slog.LevelError
	}

	handler = slog.NewTextHandler(os.Stdout, opts)
	return slog.New(handler)
}
