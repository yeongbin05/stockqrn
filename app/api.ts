import axios from "axios";
import { useAuthStore } from "../store";

// Axios 인스턴스 생성 (baseURL은 store에서 동적으로 주입)
const api = axios.create();

// ✅ baseURL 인터셉터
api.interceptors.request.use(
  async (config) => {
    const { access } = useAuthStore.getState();

    // 실제 API 서버 URL
    config.baseURL = 'http://192.168.0.144:8000';

    // 토큰이 있으면 Authorization 헤더 추가
    if (access) {
      config.headers = config.headers || {};
      config.headers["Authorization"] = `Bearer ${access}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ 401 에러 → 토큰 자동 갱신
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // 무한루프 방지
      const { refresh, setToken, clearToken } = useAuthStore.getState();

      if (refresh) {
        try {
          // refresh 토큰으로 새 access 요청
          const res = await axios.post('http://192.168.0.144:8000/api/users/token/refresh/', { refresh });
          const { access } = res.data;

          await setToken(access, refresh);
          originalRequest.headers["Authorization"] = `Bearer ${access}`;

          return api(originalRequest); // 실패했던 요청 재시도
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
