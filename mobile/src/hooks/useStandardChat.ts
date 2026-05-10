import { useCallback } from "react";
import { useAppDispatch } from "./redux";
import { useSendMessageMutation } from "../store/api";
import { chatActions } from "../store/chatSlice";

export function useStandardChat(chatId: string) {
  const dispatch = useAppDispatch();
  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();

  const onSend = useCallback(
    async (content: string) => {
      dispatch(
        chatActions.sendStarted({ chatId, content, mode: "standard" }),
      );
      try {
        await sendMessage({ chatId, content }).unwrap();
        dispatch(chatActions.sendSucceeded({ chatId }));
      } catch (e) {
        dispatch(
          chatActions.sendFailed({
            chatId,
            message: extractErrorMessage(e),
            content,
            mode: "standard",
          }),
        );
      }
    },
    [chatId, dispatch, sendMessage],
  );

  return {
    onSend,
    onCancel: undefined,
    streamingText: "",
    isStreaming: false,
    busy: isSending,
    isWaiting: isSending,
    cancellable: false as const,
  };
}

function extractErrorMessage(e: unknown): string {
  if (typeof e === "object" && e !== null) {
    const anyE = e as { data?: { message?: string }; message?: string };
    return anyE.data?.message ?? anyE.message ?? "Something went wrong";
  }
  return "Something went wrong";
}
