package main

import (
	"context"
	"log"
	"os/signal"
	"syscall"
	"time"

	"ai-chat/internal/aihttp"
	"ai-chat/internal/config"
	"ai-chat/internal/database"
	"ai-chat/internal/handler"
	"ai-chat/internal/model"
	"ai-chat/internal/repository"
	"ai-chat/internal/service"

	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("no .env file, reading from environment")
	}

	cfg := config.Load()

	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("database: %v", err)
	}

	if err := database.Migrate(db, &model.Chat{}, &model.Message{}); err != nil {
		log.Fatalf("migrate: %v", err)
	}

	chatRepo := repository.NewChatRepository(db)
	messageRepo := repository.NewMessageRepository(db)
	claudeClient := aihttp.NewClaudeClient(cfg.AnthropicAPIKey)
	chatService := service.NewChatService(chatRepo, messageRepo, claudeClient)
	chatHandler := handler.NewChatHandler(chatService)

	e := echo.New()
	e.HideBanner = true
	e.Use(middleware.RequestLogger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORS())

	e.GET("/", func(c echo.Context) error {
		return c.JSON(200, map[string]string{"status": "ok", "service": "ai-chat"})
	})

	chatHandler.RegisterRoutes(e)

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	go func() {
		if err := e.Start(":" + cfg.Port); err != nil {
			log.Printf("server stopped: %v", err)
		}
	}()

	<-ctx.Done()

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := e.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("shutdown: %v", err)
	}
}
