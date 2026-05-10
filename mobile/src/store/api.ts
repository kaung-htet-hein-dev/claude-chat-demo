import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_BASE_URL } from "../constants/api";
import { Chat, Message } from "../types/chat";

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    headers: { "Content-Type": "application/json" },
  }),
  tagTypes: ["Chats", "Chat"],
  endpoints: (build) => ({
    listChats: build.query<Chat[], void>({
      query: () => "/chats",
      providesTags: (result) =>
        result
          ? [
              ...result.map((c) => ({ type: "Chat" as const, id: c.id })),
              { type: "Chats" as const, id: "LIST" },
            ]
          : [{ type: "Chats" as const, id: "LIST" }],
    }),
    getChat: build.query<Chat, string>({
      query: (id) => `/chats/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Chat", id }],
    }),
    createChat: build.mutation<Chat, { title: string }>({
      query: (body) => ({ url: "/chats", method: "POST", body }),
      invalidatesTags: [{ type: "Chats", id: "LIST" }],
    }),
    sendMessage: build.mutation<Message, { chatId: string; content: string }>({
      query: ({ chatId, content }) => ({
        url: `/chats/${chatId}/messages`,
        method: "POST",
        body: { content },
      }),
      invalidatesTags: (_r, _e, { chatId }) => [{ type: "Chat", id: chatId }],
    }),
  }),
});

export const {
  useListChatsQuery,
  useGetChatQuery,
  useCreateChatMutation,
  useSendMessageMutation,
} = api;
