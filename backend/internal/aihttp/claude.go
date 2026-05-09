// Package aihttp is a Claude Messages API client built directly on net/http.
// It exposes the same Complete/Stream surface as ai.ClaudeClient, so the two
// are interchangeable via the service.AIClient interface.
package aihttp

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"

	"ai-chat/internal/ai"
)

const (
	apiURL           = "https://api.anthropic.com/v1/messages"
	apiVersion       = "2023-06-01"
	defaultModel     = "claude-opus-4-7"
	defaultMaxTokens = 8192
)

type ClaudeClient struct {
	apiKey string
	http   *http.Client
}

func NewClaudeClient(apiKey string) *ClaudeClient {
	return &ClaudeClient{
		apiKey: apiKey,
		http:   &http.Client{},
	}
}

type message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type request struct {
	Model     string    `json:"model"`
	MaxTokens int       `json:"max_tokens"`
	Stream    bool      `json:"stream,omitempty"`
	Messages  []message `json:"messages"`
}

type response struct {
	Content []struct {
		Type string `json:"type"`
		Text string `json:"text"`
	} `json:"content"`
}

type apiError struct {
	Error struct {
		Type    string `json:"type"`
		Message string `json:"message"`
	} `json:"error"`
}

// Complete sends the conversation and returns the full assistant reply.
func (c *ClaudeClient) Complete(ctx context.Context, messages []ai.Message) (string, error) {
	body, err := json.Marshal(buildRequest(messages, false))
	if err != nil {
		return "", fmt.Errorf("aihttp: complete: marshal: %w", err)
	}

	resp, err := c.do(ctx, body, false)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var out response
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return "", fmt.Errorf("aihttp: complete: decode: %w", err)
	}

	for _, b := range out.Content {
		if b.Type == "text" {
			return b.Text, nil
		}
	}
	return "", errors.New("aihttp: complete: no text in response")
}

// Stream sends the conversation and streams reply chunks via the returned channel.
// The text channel closes when streaming ends; the error channel carries at most one error.
// The caller must read both channels.
func (c *ClaudeClient) Stream(ctx context.Context, messages []ai.Message) (<-chan string, <-chan error) {
	textCh := make(chan string)
	errCh := make(chan error, 1)

	go func() {
		defer close(textCh)
		defer close(errCh)

		body, err := json.Marshal(buildRequest(messages, true))
		if err != nil {
			errCh <- fmt.Errorf("aihttp: stream: marshal: %w", err)
			return
		}

		resp, err := c.do(ctx, body, true)
		if err != nil {
			errCh <- err
			return
		}
		defer resp.Body.Close()

		if err := readSSE(ctx, resp.Body, textCh); err != nil {
			errCh <- err
		}
	}()

	return textCh, errCh
}

func (c *ClaudeClient) do(ctx context.Context, body []byte, stream bool) (*http.Response, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, apiURL, bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("aihttp: build request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", c.apiKey)
	req.Header.Set("anthropic-version", apiVersion)
	if stream {
		req.Header.Set("Accept", "text/event-stream")
	}

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("aihttp: request: %w", err)
	}
	if resp.StatusCode != http.StatusOK {
		defer resp.Body.Close()
		return nil, parseAPIError(resp)
	}
	return resp, nil
}

func buildRequest(messages []ai.Message, stream bool) request {
	out := make([]message, 0, len(messages))
	for _, m := range messages {
		if m.Role != "user" && m.Role != "assistant" {
			continue
		}
		out = append(out, message{Role: m.Role, Content: m.Content})
	}
	return request{
		Model:     defaultModel,
		MaxTokens: defaultMaxTokens,
		Stream:    stream,
		Messages:  out,
	}
}

func parseAPIError(resp *http.Response) error {
	var e apiError
	if err := json.NewDecoder(resp.Body).Decode(&e); err == nil && e.Error.Message != "" {
		return fmt.Errorf("aihttp: api %d: %s: %s", resp.StatusCode, e.Error.Type, e.Error.Message)
	}
	return fmt.Errorf("aihttp: api %d", resp.StatusCode)
}

// readSSE parses Server-Sent Events from body and forwards text deltas to textCh.
// Each SSE frame is a sequence of `event:` / `data:` lines terminated by a blank line.
func readSSE(ctx context.Context, body io.Reader, textCh chan<- string) error {
	scanner := bufio.NewScanner(body)
	scanner.Buffer(make([]byte, 0, 64*1024), 1024*1024)

	var event, data string
	for scanner.Scan() {
		line := scanner.Text()

		if line == "" {
			if data != "" {
				if err := dispatchSSE(ctx, event, data, textCh); err != nil {
					return err
				}
			}
			event, data = "", ""
			continue
		}

		switch {
		case strings.HasPrefix(line, "event:"):
			event = strings.TrimSpace(line[len("event:"):])
		case strings.HasPrefix(line, "data:"):
			data = strings.TrimSpace(line[len("data:"):])
		}
	}
	if err := scanner.Err(); err != nil {
		return fmt.Errorf("aihttp: stream: read: %w", err)
	}
	return nil
}

func dispatchSSE(ctx context.Context, event, data string, textCh chan<- string) error {
	switch event {
	case "content_block_delta":
		var payload struct {
			Delta struct {
				Type string `json:"type"`
				Text string `json:"text"`
			} `json:"delta"`
		}
		if err := json.Unmarshal([]byte(data), &payload); err != nil {
			return fmt.Errorf("aihttp: stream: parse delta: %w", err)
		}
		if payload.Delta.Type != "text_delta" || payload.Delta.Text == "" {
			return nil
		}
		select {
		case textCh <- payload.Delta.Text:
			return nil
		case <-ctx.Done():
			return ctx.Err()
		}
	case "error":
		var payload apiError
		if err := json.Unmarshal([]byte(data), &payload); err != nil {
			return fmt.Errorf("aihttp: stream: parse error event: %w", err)
		}
		return fmt.Errorf("aihttp: stream: api error: %s: %s", payload.Error.Type, payload.Error.Message)
	}
	return nil
}
