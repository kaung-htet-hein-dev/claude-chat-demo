package config

import (
	"fmt"
	"os"
)

type Config struct {
	Port            string
	AnthropicAPIKey string
	DatabaseURL     string
}

func Load() *Config {
	return &Config{
		Port:            getEnv("PORT", "8080"),
		AnthropicAPIKey: os.Getenv("API_KEY"),
		DatabaseURL:     databaseURL(),
	}
}

func databaseURL() string {
	if url := os.Getenv("DATABASE_URL"); url != "" {
		return url
	}

	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "5432")
	user := getEnv("DB_USER", "postgres")
	password := getEnv("DB_PASSWORD", "postgres")
	name := getEnv("DB_NAME", "ai_chat")
	sslmode := getEnv("DB_SSLMODE", "disable")

	return fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s",
		user, password, host, port, name, sslmode)
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
