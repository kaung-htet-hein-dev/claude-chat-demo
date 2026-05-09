package dto

import (
	"time"

	"github.com/google/uuid"
)

type SendMessageRequest struct {
	ChatID  uuid.UUID `json:"chat_id"`
	Content string    `json:"content"`
}

type MessageResponse struct {
	ID        uuid.UUID `json:"id"`
	ChatID    uuid.UUID `json:"chat_id"`
	Role      string    `json:"role"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

type ChatResponse struct {
	ID        uuid.UUID         `json:"id"`
	Title     string            `json:"title"`
	Messages  []MessageResponse `json:"messages,omitempty"`
	CreatedAt time.Time         `json:"created_at"`
}

type CreateChatRequest struct {
	Title string `json:"title"`
}
