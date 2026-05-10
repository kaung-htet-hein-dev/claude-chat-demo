import { useCallback, useMemo } from "react";
import { StyleSheet } from "react-native";
import { KeyboardGestureArea } from "react-native-keyboard-controller";
import { useSharedValue } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams } from "expo-router";
import { useAppDispatch, useAppSelector } from "@/src/hooks/redux";
import { useGetChatQuery } from "@/src/store/api";
import { chatActions } from "@/src/store/chatSlice";
import { useStandardChat } from "@/src/hooks/useStandardChat";
import { useStreamingChat } from "@/src/hooks/useStreamingChat";
import { Message } from "@/src/types/chat";
import { MessageList } from "@/src/components/MessageList";
import { ChatInput } from "@/src/components/ChatInput";
import { EmptyState } from "@/src/components/EmptyState";
import { ErrorBanner } from "@/src/components/ErrorBanner";
import { CHAT_INPUT_NATIVE_ID, INPUT_HEIGHT } from "@/src/constants/chat";

type Mode = "streaming" | "standard";

export default function ChatRoute() {
  const { mode: rawMode, id: chatId } = useLocalSearchParams<{
    mode: string;
    id: string;
  }>();
  const mode: Mode = rawMode === "standard" ? "standard" : "streaming";

  const dispatch = useAppDispatch();
  const extraContentPadding = useSharedValue(0);

  const { data: chat, isLoading: isLoadingChat } = useGetChatQuery(chatId);

  const streaming = useStreamingChat(chatId);
  const standard = useStandardChat(chatId);
  const sender = mode === "streaming" ? streaming : standard;

  const pendingUser = useAppSelector((s) => s.chat.pendingUser[chatId] ?? null);
  const error = useAppSelector((s) => s.chat.error[chatId] ?? null);
  const lastFailed = useAppSelector((s) => s.chat.lastFailed[chatId] ?? null);

  const messages = useMemo<Message[]>(() => {
    const persisted = chat?.messages ?? [];
    if (!pendingUser) return persisted;
    const optimistic: Message = {
      id: `pending_${chatId}`,
      chat_id: chatId,
      role: "user",
      content: pendingUser,
      created_at: new Date().toISOString()
    };
    return [...persisted, optimistic];
  }, [chat?.messages, pendingUser, chatId]);

  const onRetry = useCallback(() => {
    if (!lastFailed) return;
    dispatch(chatActions.clearError({ chatId }));
    sender.onSend(lastFailed.content);
  }, [chatId, dispatch, lastFailed, sender]);

  const empty = messages.length === 0 && !isLoadingChat && !sender.busy;

  return (
    <SafeAreaView edges={["bottom"]} style={styles.container}>
      <Stack.Screen
        options={{ title: mode === "streaming" ? "Streaming" : "Standard" }}
      />
      <KeyboardGestureArea
        interpolator="ios"
        offset={INPUT_HEIGHT}
        style={styles.container}
        textInputNativeID={CHAT_INPUT_NATIVE_ID}
      >
        {empty ? (
          <EmptyState
            title={mode === "streaming" ? "Streaming chat" : "Standard chat"}
            subtitle="Send a message to start the conversation."
          />
        ) : (
          <MessageList
            messages={messages}
            streamingText={sender.streamingText}
            isStreaming={sender.isStreaming}
            isWaiting={sender.isWaiting}
            extraContentPadding={extraContentPadding}
          />
        )}
        {error && lastFailed ? (
          <ErrorBanner message={error} onRetry={onRetry} />
        ) : null}
        <ChatInput
          onSend={sender.onSend}
          onCancel={sender.onCancel}
          busy={sender.busy}
          cancellable={sender.cancellable}
          placeholder={mode === "streaming" ? "Message (streaming)" : "Message"}
          extraContentPadding={extraContentPadding}
        />
      </KeyboardGestureArea>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});
