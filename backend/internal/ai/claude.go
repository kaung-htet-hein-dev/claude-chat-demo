package ai

import (
	"context"
	"fmt"

	"github.com/anthropics/anthropic-sdk-go"
	"github.com/anthropics/anthropic-sdk-go/option"
)

const (
	defaultModel     = anthropic.ModelClaudeOpus4_7
	defaultMaxTokens = int64(8192)
)

// Message represents a single turn in a conversation.
type Message struct {
	Role    string // "user" or "assistant"
	Content string
}

// ClaudeClient wraps the Anthropic SDK.
type ClaudeClient struct {
	api anthropic.Client
}

func NewClaudeClient(apiKey string) *ClaudeClient {
	return &ClaudeClient{
		api: anthropic.NewClient(option.WithAPIKey(apiKey)),
	}
}

// Complete sends the full conversation history and returns the complete assistant reply.
func (c *ClaudeClient) Complete(ctx context.Context, messages []Message) (string, error) {
	resp, err := c.api.Messages.New(ctx, anthropic.MessageNewParams{
		Model:     defaultModel,
		MaxTokens: defaultMaxTokens,
		Messages:  buildMessageParams(messages),
	})
	if err != nil {
		return "", fmt.Errorf("ai: complete: %w", err)
	}

	for _, block := range resp.Content {
		if text, ok := block.AsAny().(anthropic.TextBlock); ok {
			return text.Text, nil
		}
	}

	return "", fmt.Errorf("ai: complete: no text in response")
}

// Stream sends the full conversation history and streams reply chunks into the returned channel.
// The text channel is closed when streaming ends. The error channel carries at most one error.
// The caller must read both channels.
func (c *ClaudeClient) Stream(ctx context.Context, messages []Message) (<-chan string, <-chan error) {
	textCh := make(chan string)
	errCh := make(chan error, 1)

	go func() {
		defer close(textCh)
		defer close(errCh)

		stream := c.api.Messages.NewStreaming(ctx, anthropic.MessageNewParams{
			Model:     defaultModel,
			MaxTokens: defaultMaxTokens,
			Messages:  buildMessageParams(messages),
		})

		for stream.Next() {
			event := stream.Current()
			delta, ok := event.AsAny().(anthropic.ContentBlockDeltaEvent)
			if !ok {
				continue
			}
			text, ok := delta.Delta.AsAny().(anthropic.TextDelta)
			if !ok {
				continue
			}
			select {
			case textCh <- text.Text:
			case <-ctx.Done():
				errCh <- ctx.Err()
				return
			}
		}

		if err := stream.Err(); err != nil {
			errCh <- fmt.Errorf("ai: stream: %w", err)
		}
	}()

	return textCh, errCh
}

func buildMessageParams(messages []Message) []anthropic.MessageParam {
	params := make([]anthropic.MessageParam, 0, len(messages))
	for _, m := range messages {
		switch m.Role {
		case "user":
			params = append(params, anthropic.NewUserMessage(anthropic.NewTextBlock(m.Content)))
		case "assistant":
			params = append(params, anthropic.NewAssistantMessage(anthropic.NewTextBlock(m.Content)))
		}
	}
	return params
}
