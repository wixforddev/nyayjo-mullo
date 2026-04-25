import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { Bazars } from './pages/Bazars';
import { Prices } from './pages/Prices';
import { Alerts } from './pages/Alerts';
import { Users } from './pages/Users';
import { MarketIndex } from './pages/MarketIndex';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { borderRadius: '12px', fontSize: '14px', fontWeight: 500 },
          success: { iconTheme: { primary: '#064E3B', secondary: '#fff' } },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="bazars" element={<Bazars />} />
          <Route path="prices" element={<Prices />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="users" element={<Users />} />
          <Route path="market-index" element={<MarketIndex />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
