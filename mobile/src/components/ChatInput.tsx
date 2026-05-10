import { useCallback, useState } from "react";
import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import {
  SharedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { radii, spacing, theme, typography } from "../constants/theme";
import {
  CHAT_INPUT_NATIVE_ID,
  INPUT_HEIGHT,
  INPUT_MARGIN,
} from "../constants/chat";

type Props = {
  onSend: (content: string) => void;
  onCancel?: () => void;
  busy?: boolean;
  cancellable?: boolean;
  placeholder?: string;
  extraContentPadding?: SharedValue<number>;
};

export function ChatInput({
  onSend,
  onCancel,
  busy,
  cancellable,
  placeholder = "Message",
  extraContentPadding,
}: Props) {
  const { bottom } = useSafeAreaInsets();
  const [value, setValue] = useState("");
  const fallback = useSharedValue(0);
  const padding = extraContentPadding ?? fallback;

  const canSend = value.trim().length > 0 && !busy;

  const handleSend = () => {
    if (!canSend) return;
    onSend(value.trim());
    setValue("");
  };

  const onInputLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const next = Math.max(e.nativeEvent.layout.height - INPUT_HEIGHT, 0);
      padding.value = withTiming(next, { duration: 200 });
    },
    [padding],
  );

  return (
    <KeyboardStickyView offset={{ opened: bottom - INPUT_MARGIN }}>
      <View style={styles.wrapper}>
        <View style={styles.inputRow} onLayout={onInputLayout}>
          <TextInput
            nativeID={CHAT_INPUT_NATIVE_ID}
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={theme.textMuted}
            value={value}
            onChangeText={setValue}
            multiline
            editable={!busy || cancellable}
          />
          {cancellable && busy ? (
            <Pressable onPress={onCancel} style={styles.button}>
              <Ionicons name="stop" size={16} color={theme.textInverted} />
            </Pressable>
          ) : (
            <Pressable
              onPress={handleSend}
              disabled={!canSend}
              style={[
                styles.button,
                {
                  backgroundColor: canSend ? theme.accent : theme.surfaceMuted,
                  opacity: canSend ? 1 : 0.6,
                },
              ]}
            >
              <Ionicons
                name="arrow-up"
                size={18}
                color={canSend ? theme.textInverted : theme.textMuted}
              />
            </Pressable>
          )}
        </View>
      </View>
    </KeyboardStickyView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    backgroundColor: theme.background,
    borderTopColor: theme.border,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: radii.lg,
    minHeight: INPUT_HEIGHT,
    backgroundColor: theme.surface,
  },
  input: {
    flex: 1,
    fontSize: typography.body,
    paddingVertical: spacing.sm,
    maxHeight: 140,
    color: theme.text,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: spacing.xs,
    marginBottom: 4,
    backgroundColor: theme.danger,
  },
});
