import axios from "axios";
import { Platform } from "react-native";
import { useAuthStore } from "../store";

// ✅ 1) fallback 주소 (모바일/릴리즈에서 env가 비어도 무조건 여길 씀)
const FALLBACK_BASE_URL =
  Platform.OS === "web"
    ? "http://localhost:8000"
    : "https://stockqapp.com"; // ✅ 네 AWS 서버

// ✅ 2) Axios 인스턴스 생성 (처음부터 baseURL을 넣어둠)
const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL || FALLBACK_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ 3) request interceptor
api.interceptors.request.use(
  async (config) => {
    const { access } = useAuthStore.getState();

    // ⚠️ 매번 env로 덮어쓰되, env가 없으면 fallback 유지
    const baseURL = process.env.EXPO_PUBLIC_API_BASE_URL || FALLBACK_BASE_URL;
    config.baseURL = baseURL;

    if (access) {
      config.headers = config.headers || {};
      config.headers["Authorization"] = `Bearer ${access}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ 4) response interceptor (401 → refresh → retry)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      const { refresh, setToken, clearToken } =
        useAuthStore.getState();

      if (refresh) {
        try {
          const baseURL =
            process.env.EXPO_PUBLIC_API_BASE_URL || FALLBACK_BASE_URL;

          const res = await axios.post(
            `${baseURL}/api/users/token/refresh/`,
            { refresh },
            { headers: { "Content-Type": "application/json" } }
          );

          const { access: newAccess } = res.data;

          await setToken(newAccess, refresh);

          originalRequest.headers =
            originalRequest.headers || {};
          originalRequest.headers[
            "Authorization"
          ] = `Bearer ${newAccess}`;

          return api(originalRequest);
        } catch (refreshError) {
          console.error("Refresh Token 만료 또는 에러", refreshError);
          await clearToken();
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
