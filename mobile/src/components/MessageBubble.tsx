import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { EnrichedMarkdownText } from "react-native-enriched-markdown";
import { Message } from "../types/chat";
import { radii, spacing, theme, typography } from "../constants/theme";

type Props = {
  message: Message;
};

function MessageBubbleBase({ message }: Props) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <View style={[styles.row, styles.rowUser]}>
        <View
          style={[
            styles.bubbleUser,
            { backgroundColor: theme.bubbleUser },
          ]}
        >
          <Text
            style={[
              styles.userText,
              { color: theme.textInverted },
            ]}
          >
            {message.content}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.rowAssistant}>
      <EnrichedMarkdownText
        markdown={message.content || " "}
        markdownStyle={{
          paragraph: { color: theme.text, fontSize: typography.body, lineHeight: 24 },
          h1: { color: theme.text, fontSize: 22, fontWeight: "700" },
          h2: { color: theme.text, fontSize: 20, fontWeight: "700" },
          h3: { color: theme.text, fontSize: 18, fontWeight: "600" },
          link: { color: theme.text, underline: true },
          code: {
            color: theme.text,
            backgroundColor: theme.surfaceMuted,
            fontFamily: "Menlo",
            fontSize: 14,
          },
          codeBlock: {
            backgroundColor: theme.surface,
            borderRadius: radii.sm,
            padding: spacing.md,
          },
          blockquote: {
            borderColor: theme.border,
            backgroundColor: theme.surface,
          },
        }}
        containerStyle={styles.assistantContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    flexDirection: "row",
  },
  rowUser: {
    justifyContent: "flex-end",
  },
  rowAssistant: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  bubbleUser: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md + 2,
    borderRadius: radii.lg,
    maxWidth: "85%",
  },
  userText: {
    fontSize: typography.body,
    lineHeight: 22,
  },
  assistantContainer: {
    paddingVertical: spacing.xs,
  },
});

export const MessageBubble = memo(MessageBubbleBase, (prev, next) => {
  return (
    prev.message.id === next.message.id &&
    prev.message.content === next.message.content &&
    prev.message.role === next.message.role
  );
});
