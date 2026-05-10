# ai-chat-demo

A small chat app that talks to Claude. Built to learn how AI chat apps work.

It supports two modes:

- **Standard** — wait for the full reply, then show it.
- **Streaming** — show the reply word by word as it arrives (SSE).

## Demo

### Standard mode

![Standard mode](./assets/standard.gif)

### Streaming mode

![Streaming mode](./assets/streaming.gif)

## What's inside

```
ai-chat/
  backend/   Go API (Echo, GORM, PostgreSQL, Claude API, SSE)
  mobile/    Expo React Native app (Redux Toolkit, expo-router)
  assets/    demo GIFs
  docker-compose.yml
```

The mobile app shows a chat list, lets you start a new chat in either mode, and renders assistant replies as Markdown.

The backend stores chats and messages in PostgreSQL and forwards each conversation to the Claude API.

## API

```
POST   /chats                       create a chat
GET    /chats                       list chats
GET    /chats/:id                   get one chat with messages
POST   /chats/:id/messages          send a message (standard)
POST   /chats/:id/messages/stream   send a message (streaming via SSE)
```

## Run it

### 1. Backend + database

Set your Claude key in `backend/.env`, then:

```
docker compose up
```

The API listens on `http://localhost:8080`.

### 2. Mobile app

```
cd mobile
yarn install
yarn ios     # or: yarn android
```

Make sure the app points at your backend URL (see `mobile/src/store/api.ts`).

## Goal

This is a learning project, not production code. The focus is on chat UX, streaming, Markdown rendering, and a clean separation between handler, service, and repository on the backend.
