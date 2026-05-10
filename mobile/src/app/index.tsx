import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  useCreateChatMutation,
  useListChatsQuery,
} from "@/src/store/api";
import { Chat } from "@/src/types/chat";
import { EmptyState } from "@/src/components/EmptyState";
import { radii, spacing, theme, typography } from "@/src/constants/theme";

type Mode = "streaming" | "standard";

export default function ChatListScreen() {
  const { data: chats = [], isFetching, refetch } = useListChatsQuery();
  const [createChat, { isLoading: isCreating }] = useCreateChatMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [pendingMode, setPendingMode] = useState<Mode | null>(null);

  const startNew = (mode: Mode) => {
    setPendingMode(mode);
    setTitle("");
    setModalOpen(true);
  };

  const confirmCreate = async () => {
    if (!pendingMode) return;
    const mode = pendingMode;
    const trimmed = title.trim() || "New chat";
    setModalOpen(false);
    setPendingMode(null);
    try {
      const chat = await createChat({ title: trimmed }).unwrap();
      router.push(`/chat/${mode}/${chat.id}` as never);
    } catch {
      // surface basic error via no-op; ErrorBanner is per-chat. Keep list resilient.
    }
  };

  const renderItem = ({ item }: { item: Chat }) => (
    <Pressable
      style={({ pressed }) => [
        styles.chatRow,
        {
          backgroundColor: pressed ? theme.surfaceMuted : theme.surface,
          borderColor: theme.border,
        },
      ]}
      onLongPress={() => router.push(`/chat/standard/${item.id}` as never)}
      onPress={() => router.push(`/chat/streaming/${item.id}` as never)}
    >
      <View style={styles.chatRowText}>
        <Text style={[styles.chatTitle, { color: theme.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.chatHint, { color: theme.textMuted }]}>
          Tap = streaming · Long-press = standard
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={chats}
        keyExtractor={(c) => c.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} />
        }
        ListEmptyComponent={
          isFetching ? (
            <View style={styles.center}>
              <ActivityIndicator color={theme.textMuted} />
            </View>
          ) : (
            <EmptyState
              title="No chats yet"
              subtitle="Start a new conversation below."
            />
          )
        }
      />

      <View
        style={[
          styles.actions,
          { backgroundColor: theme.background, borderTopColor: theme.border },
        ]}
      >
        <Pressable
          style={[styles.action, { backgroundColor: theme.accent }]}
          onPress={() => startNew("streaming")}
          disabled={isCreating}
        >
          <Ionicons name="flash" size={16} color={theme.textInverted} />
          <Text style={[styles.actionText, { color: theme.textInverted }]}>
            New streaming chat
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.action,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
          onPress={() => startNew("standard")}
          disabled={isCreating}
        >
          <Ionicons name="chatbubble-outline" size={16} color={theme.text} />
          <Text style={[styles.actionText, { color: theme.text }]}>
            New standard chat
          </Text>
        </Pressable>
      </View>

      <Modal
        visible={modalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.background, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Name this chat
            </Text>
            <TextInput
              autoFocus
              placeholder="e.g. Trip ideas"
              placeholderTextColor={theme.textMuted}
              style={[
                styles.modalInput,
                {
                  color: theme.text,
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
              value={title}
              onChangeText={setTitle}
              onSubmitEditing={confirmCreate}
            />
            <View style={styles.modalRow}>
              <Pressable
                onPress={() => setModalOpen(false)}
                style={styles.modalAction}
              >
                <Text style={[styles.modalActionText, { color: theme.textMuted }]}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable onPress={confirmCreate} style={styles.modalAction}>
                <Text
                  style={[
                    styles.modalActionText,
                    { color: theme.text, fontWeight: "600" },
                  ]}
                >
                  Create
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: spacing.lg,
    gap: spacing.sm,
    flexGrow: 1,
  },
  chatRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
  chatRowText: {
    flex: 1,
    gap: 2,
  },
  chatTitle: {
    fontSize: typography.body,
    fontWeight: "600",
  },
  chatHint: {
    fontSize: typography.small,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: {
    padding: spacing.md,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "transparent",
    gap: spacing.sm,
  },
  actionText: {
    fontSize: typography.body,
    fontWeight: "600",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  modalCard: {
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalTitle: {
    fontSize: typography.title,
    fontWeight: "600",
  },
  modalInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: typography.body,
  },
  modalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.lg,
  },
  modalAction: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  modalActionText: {
    fontSize: typography.body,
  },
});
