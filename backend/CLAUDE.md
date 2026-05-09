# Project Overview

This is a learning project to understand how AI chat applications work.

Tech stack:

- Go
- Echo
- PostgreSQL
- GORM
- Claude API
- SSE streaming

# Architecture Rules

Follow clean architecture principles.

Structure:

- handler -> service -> repository
- handlers should not contain business logic
- services contain AI orchestration logic
- repositories handle database operations only
- docker for postgresql and api service

# Coding Rules

- Use small functions
- Prefer explicit code over abstraction
- Avoid overengineering
- Avoid interfaces unless necessary
- Keep files under 300 lines
- Use context.Context everywhere
- Return proper errors
- Use DTOs for request/response

# AI Chat Rules

- Messages are stored in PostgreSQL
- Every request sends full conversation history to Claude
- Support both streaming and non-streaming responses
- Streaming uses Server Sent Events (SSE)

# Goal

The goal is learning architecture and AI streaming, not production scale.
