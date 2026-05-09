package database

import (
	"context"
	"fmt"
	"sync"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

const (
	maxOpenConns    = 25
	maxIdleConns    = 10
	connMaxLifetime = 5 * time.Minute
	connMaxIdleTime = 3 * time.Minute
)

var (
	instance *gorm.DB
	mu       sync.Mutex
)

// Connect opens a PostgreSQL connection and configures the pool.
// Subsequent calls return the existing instance without reconnecting.
func Connect(dsn string) (*gorm.DB, error) {
	mu.Lock()
	defer mu.Unlock()

	if instance != nil {
		return instance, nil
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		return nil, fmt.Errorf("database: open connection: %w", err)
	}

	if err := configurePool(db); err != nil {
		return nil, err
	}

	instance = db
	return instance, nil
}

// Migrate runs AutoMigrate for the given GORM models.
// Safe to call on every startup — only adds, never drops columns.
func Migrate(db *gorm.DB, models ...any) error {
	if err := db.AutoMigrate(models...); err != nil {
		return fmt.Errorf("database: migrate: %w", err)
	}
	return nil
}

// Ping checks the database connection is still alive.
func Ping(ctx context.Context, db *gorm.DB) error {
	sqlDB, err := db.DB()
	if err != nil {
		return fmt.Errorf("database: get sql.DB: %w", err)
	}
	if err := sqlDB.PingContext(ctx); err != nil {
		return fmt.Errorf("database: ping: %w", err)
	}
	return nil
}

func configurePool(db *gorm.DB) error {
	sqlDB, err := db.DB()
	if err != nil {
		return fmt.Errorf("database: get sql.DB: %w", err)
	}

	sqlDB.SetMaxOpenConns(maxOpenConns)
	sqlDB.SetMaxIdleConns(maxIdleConns)
	sqlDB.SetConnMaxLifetime(connMaxLifetime)
	sqlDB.SetConnMaxIdleTime(connMaxIdleTime)

	return nil
}
