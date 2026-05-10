import { Pressable, StyleSheet, Text, View } from "react-native";
import { radii, spacing, theme, typography } from "../constants/theme";

type Props = {
  message: string;
  onRetry?: () => void;
};

export function ErrorBanner({ message, onRetry }: Props) {
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <Text style={[styles.text, { color: theme.danger }]} numberOfLines={2}>
        {message}
      </Text>
      {onRetry ? (
        <Pressable onPress={onRetry} style={styles.button}>
          <Text style={[styles.buttonText, { color: theme.text }]}>Retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
  text: {
    flex: 1,
    fontSize: typography.small,
  },
  button: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  buttonText: {
    fontSize: typography.small,
    fontWeight: "600",
  },
});
