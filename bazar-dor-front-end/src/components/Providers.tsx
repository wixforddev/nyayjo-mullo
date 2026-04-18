'use client';

import { Provider } from 'react-redux';
import { store } from '../store';
import { AlertToast } from './AlertToast';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      {children}
      <AlertToast />
    </Provider>
  );
}
