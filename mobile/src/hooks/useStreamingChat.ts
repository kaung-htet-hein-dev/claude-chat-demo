import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "./redux";
import { cancelStream, startStream } from "../store/streamThunk";

export function useStreamingChat(chatId: string) {
  const dispatch = useAppDispatch();
  const streamingText = useAppSelector(
    (s) => s.chat.streaming[chatId] ?? "",
  );
  const isStreaming = useAppSelector(
    (s) => s.chat.isStreaming[chatId] ?? false,
  );

  const onSend = useCallback(
    (content: string) => {
      dispatch(startStream(chatId, content));
    },
    [chatId, dispatch],
  );

  const onCancel = useCallback(() => {
    dispatch(cancelStream(chatId));
  }, [chatId, dispatch]);

  return {
    onSend,
    onCancel,
    streamingText,
    isStreaming,
    busy: isStreaming,
    isWaiting: isStreaming && streamingText.length === 0,
    cancellable: true as const,
  };
}
