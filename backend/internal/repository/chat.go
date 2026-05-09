package repository

import (
	"context"
	"errors"
	"fmt"

	"ai-chat/internal/model"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ChatRepository struct {
	db *gorm.DB
}

func NewChatRepository(db *gorm.DB) *ChatRepository {
	return &ChatRepository{db: db}
}

func (r *ChatRepository) Create(ctx context.Context, chat *model.Chat) error {
	if err := r.db.WithContext(ctx).Create(chat).Error; err != nil {
		return fmt.Errorf("chat repository: create: %w", err)
	}
	return nil
}

func (r *ChatRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.Chat, error) {
	var chat model.Chat
	err := r.db.WithContext(ctx).First(&chat, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("chat repository: get by id: %w", err)
	}
	return &chat, nil
}

func (r *ChatRepository) List(ctx context.Context) ([]model.Chat, error) {
	var chats []model.Chat
	err := r.db.WithContext(ctx).Order("created_at desc").Find(&chats).Error
	if err != nil {
		return nil, fmt.Errorf("chat repository: list: %w", err)
	}
	return chats, nil
}
