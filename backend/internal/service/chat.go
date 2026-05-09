package service

import (
	"context"
	"fmt"
	"strings"

	"ai-chat/internal/ai"
	"ai-chat/internal/dto"
	"ai-chat/internal/model"
	"ai-chat/internal/repository"
)

// AIClient is what the service needs from any Claude implementation.
// Both ai.ClaudeClient (SDK-based) and aihttp.ClaudeClient (raw HTTP) satisfy it.
type AIClient interface {
	Complete(ctx context.Context, messages []ai.Message) (string, error)
	Stream(ctx context.Context, messages []ai.Message) (<-chan string, <-chan error)
}

type ChatService struct {
	chatRepo    *repository.ChatRepository
	messageRepo *repository.MessageRepository
	claude      AIClient
}

func NewChatService(
	chatRepo *repository.ChatRepository,
	messageRepo *repository.MessageRepository,
	claude AIClient,
) *ChatService {
	return &ChatService{
		chatRepo:    chatRepo,
		messageRepo: messageRepo,
		claude:      claude,
	}
}

func (s *ChatService) CreateChat(ctx context.Context, req dto.CreateChatRequest) (*dto.ChatResponse, error) {
	chat := &model.Chat{Title: req.Title}

	if err := s.chatRepo.Create(ctx, chat); err != nil {
		return nil, fmt.Errorf("service: create chat: %w", err)
	}

	return toChatResponse(chat, nil), nil
}

func (s *ChatService) GetChat(ctx context.Context, id string) (*dto.ChatResponse, error) {
	parsed, err := parseUUID(id)
	if err != nil {
		return nil, err
	}

	chat, err := s.chatRepo.GetByID(ctx, parsed)
	if err != nil {
		return nil, fmt.Errorf("service: get chat: %w", err)
	}
	if chat == nil {
		return nil, ErrChatNotFound
	}

	messages, err := s.messageRepo.ListByChatID(ctx, chat.ID)
	if err != nil {
		return nil, fmt.Errorf("service: get chat: %w", err)
	}

	return toChatResponse(chat, messages), nil
}

func (s *ChatService) ListChats(ctx context.Context) ([]dto.ChatResponse, error) {
	chats, err := s.chatRepo.List(ctx)
	if err != nil {
		return nil, fmt.Errorf("service: list chats: %w", err)
	}

	responses := make([]dto.ChatResponse, len(chats))
	for i := range chats {
		responses[i] = *toChatResponse(&chats[i], nil)
	}
	return responses, nil
}

// SendMessage persists the user message, calls Claude, persists the reply, and returns it.
func (s *ChatService) SendMessage(ctx context.Context, req dto.SendMessageRequest) (*dto.MessageResponse, error) {
	chat, err := s.chatRepo.GetByID(ctx, req.ChatID)
	if err != nil {
		return nil, fmt.Errorf("service: send message: %w", err)
	}
	if chat == nil {
		return nil, ErrChatNotFound
	}

	history, err := s.messageRepo.ListByChatID(ctx, req.ChatID)
	if err != nil {
		return nil, fmt.Errorf("service: send message: load history: %w", err)
	}

	userMsg := &model.Message{
		ChatID:  req.ChatID,
		Role:    model.RoleUser,
		Content: req.Content,
	}
	if err := s.messageRepo.Save(ctx, userMsg); err != nil {
		return nil, fmt.Errorf("service: send message: save user msg: %w", err)
	}

	claudeMessages := buildHistory(history, req.Content)

	reply, err := s.claude.Complete(ctx, claudeMessages)
	if err != nil {
		return nil, fmt.Errorf("service: send message: claude: %w", err)
	}

	assistantMsg := &model.Message{
		ChatID:  req.ChatID,
		Role:    model.RoleAssistant,
		Content: reply,
	}
	if err := s.messageRepo.Save(ctx, assistantMsg); err != nil {
		return nil, fmt.Errorf("service: send message: save assistant msg: %w", err)
	}

	return toMessageResponse(assistantMsg), nil
}

// SendMessageStream saves the user message, streams Claude's reply chunk by chunk,
// then persists the complete assistant message only after the stream ends.
func (s *ChatService) SendMessageStream(ctx context.Context, req dto.SendMessageRequest) (<-chan string, <-chan error) {
	textCh := make(chan string)
	errCh := make(chan error, 1)

	go func() {
		defer close(textCh)
		defer close(errCh)

		chat, err := s.chatRepo.GetByID(ctx, req.ChatID)
		if err != nil {
			errCh <- fmt.Errorf("service: stream message: %w", err)
			return
		}
		if chat == nil {
			errCh <- ErrChatNotFound
			return
		}

		history, err := s.messageRepo.ListByChatID(ctx, req.ChatID)
		if err != nil {
			errCh <- fmt.Errorf("service: stream message: load history: %w", err)
			return
		}

		userMsg := &model.Message{
			ChatID:  req.ChatID,
			Role:    model.RoleUser,
			Content: req.Content,
		}
		if err := s.messageRepo.Save(ctx, userMsg); err != nil {
			errCh <- fmt.Errorf("service: stream message: save user msg: %w", err)
			return
		}

		claudeMessages := buildHistory(history, req.Content)
		chunkCh, claudeErrCh := s.claude.Stream(ctx, claudeMessages)

		var sb strings.Builder
		for chunk := range chunkCh {
			sb.WriteString(chunk)
			select {
			case textCh <- chunk:
			case <-ctx.Done():
				errCh <- ctx.Err()
				return
			}
		}

		if err := <-claudeErrCh; err != nil {
			errCh <- fmt.Errorf("service: stream message: claude: %w", err)
			return
		}

		assistantMsg := &model.Message{
			ChatID:  req.ChatID,
			Role:    model.RoleAssistant,
			Content: sb.String(),
		}
		if err := s.messageRepo.Save(ctx, assistantMsg); err != nil {
			errCh <- fmt.Errorf("service: stream message: save assistant msg: %w", err)
		}
	}()

	return textCh, errCh
}

// buildHistory converts the stored message history plus the new user message
// into the format the Claude client expects.
func buildHistory(existing []model.Message, newUserContent string) []ai.Message {
	messages := make([]ai.Message, 0, len(existing)+1)
	for _, m := range existing {
		messages = append(messages, ai.Message{
			Role:    string(m.Role),
			Content: m.Content,
		})
	}
	messages = append(messages, ai.Message{Role: "user", Content: newUserContent})
	return messages
}

func toChatResponse(chat *model.Chat, messages []model.Message) *dto.ChatResponse {
	resp := &dto.ChatResponse{
		ID:        chat.ID,
		Title:     chat.Title,
		CreatedAt: chat.CreatedAt,
	}
	if len(messages) > 0 {
		resp.Messages = make([]dto.MessageResponse, len(messages))
		for i := range messages {
			resp.Messages[i] = *toMessageResponse(&messages[i])
		}
	}
	return resp
}

func toMessageResponse(m *model.Message) *dto.MessageResponse {
	return &dto.MessageResponse{
		ID:        m.ID,
		ChatID:    m.ChatID,
		Role:      string(m.Role),
		Content:   m.Content,
		CreatedAt: m.CreatedAt,
	}
}
