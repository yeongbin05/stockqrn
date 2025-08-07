import axios from 'axios';
import { useAuthStore } from '../store';

// API 인스턴스 생성
const api = axios.create({
  baseURL: 'http://192.168.84.226:8000',  // 백엔드 URL
});

// 인증 토큰 자동 첨부 인터셉터
api.interceptors.request.use(
  async (config) => {
    // 상태에서 액세스 토큰을 가져오기
    const access = useAuthStore.getState().access; // 상태에서 액세스 토큰을 직접 가져옵니다.
    console.log('Access Token:', access);

    if (access) {
      // Authorization 헤더에 Bearer <token> 형식으로 추가
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${access}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;  // 무한 루프 방지
      const { refresh } = useAuthStore.getState();
      if (refresh) {
        try {
          const res = await axios.post('http://192.168.84.226:8000/api/users/token/refresh/', { refresh });
          const { access } = res.data;
          await useAuthStore.getState().setToken(access, refresh);
          originalRequest.headers['Authorization'] = `Bearer ${access}`;
          return api(originalRequest);  // 재요청
        } catch (refreshError) {
          console.error('Refresh Token 만료 또는 에러', refreshError);
          await useAuthStore.getState().clearToken();
        }
      }
    }
    return Promise.reject(error);
  }
);
export default api;
