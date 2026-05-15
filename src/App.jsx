import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LogisticsProvider, useLogistics } from './contexts/LogisticsContext';
import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminDrivers } from './pages/admin/AdminDrivers';
import { AdminCash } from './pages/admin/AdminCash';
import { AdminBilling } from './pages/admin/AdminBilling';
import { ClientDashboard } from './pages/client/ClientDashboard';
import { ClientCreateOrder } from './pages/ClientCreateOrder';

import AdminUsers from './pages/admin/AdminUsers';
import ClientProfile from './pages/client/ClientProfile';

const AppRoutes = () => {
  const { currentUser } = useLogistics();

  if (!currentUser) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
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
          <Route path="/create-order" element={<ClientCreateOrder />} />

        </>
      ) : (
        <>
          <Route path="/client" element={<ClientDashboard />} />
          <Route path="/client/orders" element={<AdminOrders />} />
          <Route path="/create-order" element={<ClientCreateOrder />} />
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

        <script src="http://192.168.1.16:4000/widgets/chatbot-widget.js" data-api-key="21e5bfad-dec3-4187-9293-698e87da5a4e"
          data-primary-color="#4f46e5" data-bot-name="zeroqueries"
          data-greeting="Hello! How can I help you with your data today?" async></script>
      </LogisticsProvider>
    </BrowserRouter>
  );
}
