import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type SendMode = "standard" | "stream";

type FailedInput = {
  content: string;
  mode: SendMode;
};

type ChatLocalState = {
  streaming: Record<string, string>;
  isStreaming: Record<string, boolean>;
  pendingUser: Record<string, string | null>;
  error: Record<string, string | null>;
  lastFailed: Record<string, FailedInput | null>;
};

const initialState: ChatLocalState = {
  streaming: {},
  isStreaming: {},
  pendingUser: {},
  error: {},
  lastFailed: {},
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    sendStarted: (
      state,
      action: PayloadAction<{ chatId: string; content: string; mode: SendMode }>,
    ) => {
      const { chatId, content, mode } = action.payload;
      state.pendingUser[chatId] = content;
      state.error[chatId] = null;
      state.lastFailed[chatId] = null;
      if (mode === "stream") {
        state.streaming[chatId] = "";
        state.isStreaming[chatId] = true;
      }
    },
    streamChunk: (
      state,
      action: PayloadAction<{ chatId: string; chunk: string }>,
    ) => {
      const { chatId, chunk } = action.payload;
      state.streaming[chatId] = (state.streaming[chatId] ?? "") + chunk;
    },
    sendSucceeded: (state, action: PayloadAction<{ chatId: string }>) => {
      const { chatId } = action.payload;
      state.streaming[chatId] = "";
      state.isStreaming[chatId] = false;
      state.pendingUser[chatId] = null;
    },
    sendFailed: (
      state,
      action: PayloadAction<{
        chatId: string;
        message: string;
        content: string;
        mode: SendMode;
      }>,
    ) => {
      const { chatId, message, content, mode } = action.payload;
      state.streaming[chatId] = "";
      state.isStreaming[chatId] = false;
      state.pendingUser[chatId] = null;
      state.error[chatId] = message;
      state.lastFailed[chatId] = { content, mode };
    },
    streamCancelled: (state, action: PayloadAction<{ chatId: string }>) => {
      const { chatId } = action.payload;
      state.streaming[chatId] = "";
      state.isStreaming[chatId] = false;
      state.pendingUser[chatId] = null;
    },
    clearError: (state, action: PayloadAction<{ chatId: string }>) => {
      state.error[action.payload.chatId] = null;
      state.lastFailed[action.payload.chatId] = null;
    },
  },
});

export const chatActions = chatSlice.actions;
export default chatSlice.reducer;
