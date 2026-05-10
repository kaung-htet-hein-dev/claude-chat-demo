import { forwardRef, useCallback, useMemo } from "react";
import {
  FlatList,
  ListRenderItem,
  ScrollViewProps,
  StyleSheet,
  View
} from "react-native";
import {
  KeyboardChatScrollView,
  KeyboardChatScrollViewProps
} from "react-native-keyboard-controller";
import { SharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Message } from "../types/chat";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { spacing } from "../constants/theme";
import { INPUT_HEIGHT, INPUT_MARGIN } from "../constants/chat";

type Props = {
  messages: Message[];
  streamingText?: string;
  isStreaming?: boolean;
  isWaiting?: boolean;
  extraContentPadding: SharedValue<number>;
};

const STREAM_ID = "__streaming__";
const TYPING_ID = "__typing__";

type ScrollRef = React.ComponentRef<typeof KeyboardChatScrollView>;

const ChatScrollView = forwardRef<
  ScrollRef,
  ScrollViewProps & KeyboardChatScrollViewProps
>((props, ref) => {
  const { bottom } = useSafeAreaInsets();
  return (
    <KeyboardChatScrollView
      ref={ref}
      inverted
      keyboardLiftBehavior="always"
      automaticallyAdjustContentInsets={false}
      contentInsetAdjustmentBehavior="never"
      keyboardDismissMode="interactive"
      offset={bottom - INPUT_MARGIN}
      {...props}
    />
  );
});
ChatScrollView.displayName = "ChatScrollView";

const keyExtractor = (item: Message) => item.id;

export function MessageList({
  messages,
  streamingText,
  isStreaming,
  isWaiting,
  extraContentPadding
}: Props) {
  const data: Message[] = useMemo(() => {
    const reversed = [...messages].reverse();
    const chatId = messages[messages.length - 1]?.chat_id ?? "";
    const now = new Date().toISOString();

    if (isStreaming) {
      return [
        {
          id: STREAM_ID,
          chat_id: chatId,
          role: "assistant",
          content: streamingText ?? "",
          created_at: now
        },
        ...reversed
      ];
    }
    if (isWaiting) {
      return [
        {
          id: TYPING_ID,
          chat_id: chatId,
          role: "assistant",
          content: "",
          created_at: now
        },
        ...reversed
      ];
    }
    return reversed;
  }, [messages, isStreaming, streamingText, isWaiting]);

  const renderItem = useCallback<ListRenderItem<Message>>(({ item }) => {
    if (item.id === TYPING_ID) {
      return (
        <View style={styles.typing}>
          <TypingIndicator />
        </View>
      );
    }
    return <MessageBubble message={item} />;
  }, []);

  const renderScrollComponent = useCallback(
    (props: ScrollViewProps) => (
      <ChatScrollView {...props} extraContentPadding={extraContentPadding} />
    ),
    [extraContentPadding]
  );

  return (
    <FlatList
      data={data}
      inverted
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.content}
      renderScrollComponent={renderScrollComponent}
      removeClippedSubviews={false}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: INPUT_HEIGHT + INPUT_MARGIN,
    paddingBottom: spacing.md
  },
  typing: {
    paddingHorizontal: spacing.sm
  }
});
