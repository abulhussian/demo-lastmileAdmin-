import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LogisticsProvider, useLogistics } from './contexts/LogisticsContext';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminDrivers } from './pages/admin/AdminDrivers';
import { AdminCash } from './pages/admin/AdminCash';
import { AdminBilling } from './pages/admin/AdminBilling';
import { ClientDashboard } from './pages/client/ClientDashboard';
import { ClientCreateOrder } from './pages/client/ClientCreateOrder';

import AdminUsers from './pages/admin/AdminUsers';
import ClientProfile from './pages/client/ClientProfile';

const AppRoutes = () => {
  const { currentUser } = useLogistics();

  if (!currentUser) {
    return <LoginPage />;
  }

  const isAdmin = currentUser.role === 'ADMIN';

  return (
    <Routes>
      <Route path="/" element={<Navigate to={isAdmin ? "/admin" : "/client"} replace />} />
      {isAdmin ? (
        <>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/drivers" element={<AdminDrivers />} />
          <Route path="/admin/cash" element={<AdminCash />} />
          <Route path="/admin/billing" element={<AdminBilling />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/profile" element={<ClientProfile />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </>
      ) : (
        <>
          <Route path="/client" element={<ClientDashboard />} />
          <Route path="/client/orders" element={<AdminOrders />} />
          <Route path="/client/create-order" element={<ClientCreateOrder />} />
          <Route path="/client/billing" element={<AdminBilling />} />
          <Route path="/client/profile" element={<ClientProfile />} />
          <Route path="*" element={<Navigate to="/client" replace />} />
        </>
      )}
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <LogisticsProvider>
        <AppRoutes />
      </LogisticsProvider>
    </BrowserRouter>
  );
}
