package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Chat struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey"`
	Title     string    `gorm:"not null"`
	Messages  []Message `gorm:"foreignKey:ChatID"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

func (c *Chat) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}
