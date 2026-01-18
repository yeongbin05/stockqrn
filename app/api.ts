// app/api.ts
import axios from "axios";
import { useAuthStore } from "../store";

// ✅ 이제는 모든 플랫폼에서 이 주소만 사용
const BASE_URL = "https://stockqapp.com";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ 요청 인터셉터: 항상 BASE_URL 고정 + 토큰 자동 첨부
api.interceptors.request.use(
  async (config) => {
    const { access } = useAuthStore.getState();

    // 혹시라도 다른 데서 baseURL 건드려도 여기서 다시 고정
    config.baseURL = BASE_URL;

    if (access) {
      config.headers = config.headers || {};
      config.headers["Authorization"] = `Bearer ${access}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ 응답 인터셉터: 401 이면 refresh로 재발급 → 한 번만 재시도
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 응답이 없거나, 요청 객체가 없으면 그냥 에러 리턴
    if (!error.response || !originalRequest) {
      return Promise.reject(error);
    }

    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const { refresh, setToken, clearToken } = useAuthStore.getState();

      if (refresh) {
        try {
          const res = await axios.post(
            `${BASE_URL}/api/auth/token/refresh/`,
            { refresh },
            { headers: { "Content-Type": "application/json" } }
          );

          const { access: newAccess } = res.data;

          await setToken(newAccess, refresh);

          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers["Authorization"] = `Bearer ${newAccess}`;

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
