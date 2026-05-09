# Project Overview

This is a mobile AI chat application built with Expo and React Native.

The goal is to learn:

- AI chat architecture
- streaming UI updates
- markdown rendering
- chat state management
- mobile chat UX

This is NOT a production-scale application.

Keep architecture simple, readable, and beginner friendly.

---

# Tech Stack

- Expo
- React Native
- TypeScript
- Zustand
- Axios
- Server Sent Events (SSE)
- react-native-enriched-markdown

Markdown library:
https://github.com/software-mansion-labs/react-native-enriched-markdown

---

# UI Style

The UI should feel:

- minimal
- calm
- modern
- smooth
- similar to ChatGPT mobile UX

Avoid:

- excessive animations
- heavy gradients
- overdesigned components
- complicated abstractions

Prefer:

- soft spacing
- rounded corners
- readable typography
- smooth scrolling
- clean dark/light support

---

# Architecture Rules

Use simple scalable structure.

Structure:

src/
components/
screens/
services/
store/
hooks/
types/
constants/
utils/

Rules:

- separate UI from business logic
- keep components small
- avoid prop drilling
- use Zustand for global chat state
- API logic belongs in services
- avoid large files
- avoid unnecessary custom hooks

---

# Chat Requirements

Features:

- user can send message
- assistant replies
- support streaming responses
- support non-streaming responses
- markdown rendering
- auto scroll to latest message
- loading state
- typing indicator
- retry failed messages

Messages:

- user
- assistant

Conversation should behave similar to ChatGPT.

---

# Streaming Rules

Streaming uses SSE.

Requirements:

- append tokens progressively
- avoid re-rendering entire chat list
- smooth streaming updates
- handle disconnects gracefully
- support cancellation later

Do not use websocket unless necessary.

---

# Markdown Rules

Use:
react-native-enriched-markdown

Requirements:

- render markdown safely
- support:
  - headings
  - bold
  - italic
  - inline code
  - code blocks
  - bullet lists
  - numbered lists
  - block quotes
- code blocks should be readable
- markdown rendering must work during streaming

Avoid custom markdown parsers unless necessary.

---

# State Management Rules

Use Zustand.

Store responsibilities:

- messages
- streaming state
- loading state
- active chat id

Avoid:

- deeply nested state
- excessive selectors
- Redux-style boilerplate

Keep store simple.

---

# Performance Rules

AI chats can become large.

Requirements:

- use FlashList or FlatList properly
- avoid unnecessary re-renders
- memoize message items if needed
- avoid recreating functions excessively
- streaming should remain smooth

Do not optimize prematurely.

---

# TypeScript Rules

- avoid any
- create proper message types
- keep types simple
- colocate related types when appropriate

Message type example:

type MessageRole = "user" | "assistant"

---

# Code Style

Prefer:

- explicit code
- readable code
- beginner friendly patterns

Avoid:

- advanced abstractions
- complicated generics
- enterprise architecture
- premature optimization

---

# Goal

Primary learning goals:

- understand AI chat UX
- understand streaming architecture
- understand markdown rendering
- understand state synchronization
- understand React Native performance patterns

Focus on clarity over perfection.
