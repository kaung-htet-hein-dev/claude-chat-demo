package config

import (
	"os"
)

type Config struct {
	Port      string
	AnthropicAPIKey string
	DatabaseURL     string
}

func Load() *Config {
	return &Config{
		Port:            getEnv("PORT", "8080"),
		AnthropicAPIKey: os.Getenv("API_KEY"),
		DatabaseURL:     os.Getenv("DATABASE_URL"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
