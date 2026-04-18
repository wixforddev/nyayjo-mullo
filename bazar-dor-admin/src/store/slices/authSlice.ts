import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface AuthUser {
  _id: string;
  fullName: string;
  email: string;
  role: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
}

const getStored = <T>(key: string): T | null => {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); }
  catch { return null; }
};

const initialState: AuthState = {
  user:  getStored<AuthUser>('admin_user'),
  token: localStorage.getItem('admin_token'),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ user: AuthUser; token: string }>) {
      const { user, token } = action.payload;
      state.user  = user;
      state.token = token;
      localStorage.setItem('admin_token', token);
      localStorage.setItem('admin_user', JSON.stringify(user));
    },
    logout(state) {
      state.user  = null;
      state.token = null;
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
