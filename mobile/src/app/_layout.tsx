import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Provider } from "react-redux";
import { store } from "@/src/store";
import { theme } from "@/src/constants/theme";

export default function RootLayout() {
  return (
    <Provider store={store}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          <SafeAreaProvider>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: theme.background },
                headerTitleStyle: { color: theme.text },
                headerTintColor: theme.text,
                contentStyle: { backgroundColor: theme.background },
                headerShadowVisible: false,
              }}
            >
              <Stack.Screen name="index" options={{ title: "Chats" }} />
              <Stack.Screen name="chat/[mode]/[id]" />
            </Stack>
          </SafeAreaProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </Provider>
  );
}
