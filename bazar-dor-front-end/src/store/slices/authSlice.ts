'use client';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  user: any | null;
  token: string | null;
  isAuthenticated: boolean;
}

const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
};

const getStoredUser = (): any | null => {
  if (typeof window === 'undefined') return null;
  const u = localStorage.getItem('user');
  return u ? JSON.parse(u) : null;
};

const initialState: AuthState = {
  user: getStoredUser(),
  token: getStoredToken(),
  isAuthenticated: !!getStoredToken(),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: any; tokens: any }>) => {
      const { user, tokens } = action.payload;
      state.user = user;
      state.token = tokens.access.token;
      state.isAuthenticated = true;
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', tokens.access.token);
        if (tokens.refresh?.token) localStorage.setItem('refreshToken', tokens.refresh.token);
        localStorage.setItem('user', JSON.stringify(user));
      }
    },
    updateUser: (state, action: PayloadAction<any>) => {
      state.user = { ...state.user, ...action.payload };
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
    },
  },
});

export const { setCredentials, updateUser, logout } = authSlice.actions;
export default authSlice.reducer;
