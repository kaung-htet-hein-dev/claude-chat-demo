import { Platform } from "react-native";

const ENV_URL = process.env.EXPO_PUBLIC_API_URL;

const fallbackHost = Platform.OS === "android" ? "10.0.2.2" : "localhost";
const FALLBACK_URL = `http://${fallbackHost}:8080`;

export const API_BASE_URL = ENV_URL && ENV_URL.length > 0 ? ENV_URL : FALLBACK_URL;
