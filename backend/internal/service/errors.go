package service

import (
	"errors"
	"fmt"

	"github.com/google/uuid"
)

var ErrChatNotFound = errors.New("chat not found")

func parseUUID(s string) (uuid.UUID, error) {
	id, err := uuid.Parse(s)
	if err != nil {
		return uuid.Nil, fmt.Errorf("service: invalid id %q: %w", s, err)
	}
	return id, nil
}
