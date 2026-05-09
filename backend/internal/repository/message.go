package repository

import (
	"context"
	"fmt"

	"ai-chat/internal/model"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type MessageRepository struct {
	db *gorm.DB
}

func NewMessageRepository(db *gorm.DB) *MessageRepository {
	return &MessageRepository{db: db}
}

func (r *MessageRepository) Save(ctx context.Context, message *model.Message) error {
	if err := r.db.WithContext(ctx).Create(message).Error; err != nil {
		return fmt.Errorf("message repository: save: %w", err)
	}
	return nil
}

func (r *MessageRepository) ListByChatID(ctx context.Context, chatID uuid.UUID) ([]model.Message, error) {
	var messages []model.Message
	err := r.db.WithContext(ctx).
		Where("chat_id = ?", chatID).
		Order("created_at asc").
		Find(&messages).Error
	if err != nil {
		return nil, fmt.Errorf("message repository: list by chat id: %w", err)
	}
	return messages, nil
}
