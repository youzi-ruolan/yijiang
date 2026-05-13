import { defineStore } from 'pinia';
import type { AdminUser } from '@/types';
import { DEFAULT_LOGIN, DEFAULT_USER } from '@/constants/auth';
import { AUTH_STORAGE_KEY } from '@/constants/storage';
import { loginApi } from '@/api/admin';

interface AuthState {
  loggedIn: boolean;
  user: AdminUser | null;
  token: string;
}

function readAuthState(): AuthState {
  const cache = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!cache) {
    return {
      loggedIn: false,
      user: null,
      token: '',
    };
  }

  try {
    return JSON.parse(cache) as AuthState;
  } catch (error) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return {
      loggedIn: false,
      user: null,
      token: '',
    };
  }
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => readAuthState(),

  getters: {
    isAuthenticated(state) {
      return state.loggedIn;
    },
  },

  actions: {
    persist() {
      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({
          loggedIn: this.loggedIn,
          user: this.user,
          token: this.token,
        }),
      );
    },

    async login(payload: { username: string; password: string }) {
      const username = payload.username.trim() || DEFAULT_LOGIN.username;
      const password = payload.password.trim() || DEFAULT_LOGIN.password;
      const response = await loginApi({ username, password });

      this.loggedIn = true;
      this.user = response.user || {
        ...DEFAULT_USER,
        username,
      };
      this.token = response.token || '';
      this.persist();

      return {
        success: true,
        message: '登录成功',
      };
    },

    logout() {
      this.loggedIn = false;
      this.user = null;
      this.token = '';
      this.persist();
    },
  },
});
