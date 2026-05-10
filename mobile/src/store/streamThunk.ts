import { streamMessage, StreamHandle } from "../services/messages";
import { api } from "./api";
import { chatActions } from "./chatSlice";
import type { AppDispatch } from "./index";

const handles: Record<string, StreamHandle | undefined> = {};

export const startStream =
  (chatId: string, content: string) => async (dispatch: AppDispatch) => {
    if (!content.trim()) return;
    dispatch(chatActions.sendStarted({ chatId, content, mode: "stream" }));

    let failure: string | null = null;

    const handle = streamMessage(chatId, content, {
      onChunk: (chunk) => {
        dispatch(chatActions.streamChunk({ chatId, chunk }));
      },
      onError: (msg) => {
        failure = msg;
      },
    });

    handles[chatId] = handle;
    await handle.done;
    delete handles[chatId];

    if (failure) {
      dispatch(
        chatActions.sendFailed({
          chatId,
          message: failure,
          content,
          mode: "stream",
        }),
      );
      return;
    }

    dispatch(chatActions.sendSucceeded({ chatId }));
    dispatch(api.util.invalidateTags([{ type: "Chat", id: chatId }]));
  };

export const cancelStream = (chatId: string) => (dispatch: AppDispatch) => {
  const handle = handles[chatId];
  if (handle) {
    handle.cancel();
    delete handles[chatId];
  }
  dispatch(chatActions.streamCancelled({ chatId }));
};
