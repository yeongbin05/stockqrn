import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  access: string | null;
  refresh: string | null;
  setToken: (access: string, refresh: string) => Promise<void>;
  clearToken: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set: any) => ({
  access: null,
  refresh: null,
  setToken: async (access: string, refresh: string) => {
    await AsyncStorage.setItem('access', access);
    await AsyncStorage.setItem('refresh', refresh);
    set({ access, refresh });
  },
  clearToken: async () => {
    await AsyncStorage.removeItem('access');
    await AsyncStorage.removeItem('refresh');
    set({ access: null, refresh: null });
  },
  hydrate: async () => {
    const access = await AsyncStorage.getItem('access');
    const refresh = await AsyncStorage.getItem('refresh');
    set({ access, refresh });
  },
})); 