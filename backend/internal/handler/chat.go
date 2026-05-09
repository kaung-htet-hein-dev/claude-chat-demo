package handler

import (
	"errors"
	"fmt"
	"net/http"

	"ai-chat/internal/dto"
	"ai-chat/internal/service"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type ChatHandler struct {
	chatService *service.ChatService
}

func NewChatHandler(chatService *service.ChatService) *ChatHandler {
	return &ChatHandler{chatService: chatService}
}

func (h *ChatHandler) RegisterRoutes(e *echo.Echo) {
	e.POST("/chats", h.CreateChat)
	e.GET("/chats", h.ListChats)
	e.GET("/chats/:id", h.GetChat)
	e.POST("/chats/:id/messages", h.SendMessage)
	e.POST("/chats/:id/messages/stream", h.StreamMessage)
}

func (h *ChatHandler) CreateChat(c echo.Context) error {
	var req dto.CreateChatRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	resp, err := h.chatService.CreateChat(c.Request().Context(), req)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusCreated, resp)
}

func (h *ChatHandler) ListChats(c echo.Context) error {
	chats, err := h.chatService.ListChats(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, chats)
}

func (h *ChatHandler) GetChat(c echo.Context) error {
	id := c.Param("id")

	resp, err := h.chatService.GetChat(c.Request().Context(), id)
	if err != nil {
		if errors.Is(err, service.ErrChatNotFound) {
			return echo.NewHTTPError(http.StatusNotFound, "chat not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, resp)
}

func (h *ChatHandler) SendMessage(c echo.Context) error {
	chatID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid chat id")
	}

	var body struct {
		Content string `json:"content"`
	}
	if err := c.Bind(&body); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	req := dto.SendMessageRequest{
		ChatID:  chatID,
		Content: body.Content,
	}

	resp, err := h.chatService.SendMessage(c.Request().Context(), req)
	if err != nil {
		if errors.Is(err, service.ErrChatNotFound) {
			return echo.NewHTTPError(http.StatusNotFound, "chat not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, resp)
}

func (h *ChatHandler) StreamMessage(c echo.Context) error {
	chatID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid chat id")
	}

	var body struct {
		Content string `json:"content"`
	}
	if err := c.Bind(&body); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	req := dto.SendMessageRequest{
		ChatID:  chatID,
		Content: body.Content,
	}

	c.Response().Header().Set("Content-Type", "text/event-stream")
	c.Response().Header().Set("Cache-Control", "no-cache")
	c.Response().Header().Set("Connection", "keep-alive")
	c.Response().WriteHeader(http.StatusOK)

	flusher, ok := c.Response().Writer.(http.Flusher)
	if !ok {
		return echo.NewHTTPError(http.StatusInternalServerError, "streaming not supported")
	}

	textCh, errCh := h.chatService.SendMessageStream(c.Request().Context(), req)

	for chunk := range textCh {
		fmt.Fprintf(c.Response(), "data: %s\n\n", chunk)
		flusher.Flush()
	}

	if err := <-errCh; err != nil {
		if errors.Is(err, service.ErrChatNotFound) {
			fmt.Fprintf(c.Response(), "event: error\ndata: chat not found\n\n")
		} else {
			fmt.Fprintf(c.Response(), "event: error\ndata: internal error\n\n")
		}
		flusher.Flush()
		return nil
	}

	fmt.Fprintf(c.Response(), "event: done\ndata: [DONE]\n\n")
	flusher.Flush()

	return nil
}
