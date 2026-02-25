import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { UserLayout } from "@/components/common/UserLayout";
import UserDashboard from "@/pages/user/Dashboard";
import MailSenderPage from "@/pages/user/MailSender";
import HistoryPage from "@/pages/user/History";
import LoginPage from "@/pages/auth/Login";
import { APP_ROUTES } from "@/constants/routes";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Redirect root to user dashboard */}
          <Route path={APP_ROUTES.HOME} element={<Navigate to={APP_ROUTES.USER.DASHBOARD} replace />} />

          {/* User section — wrapped with sidebar layout and ProtectedRoute */}
          <Route element={<ProtectedRoute><UserLayout /></ProtectedRoute>}>
            <Route path={APP_ROUTES.USER.DASHBOARD} element={<UserDashboard />} />
            <Route path={APP_ROUTES.USER.MAIL_SENDER} element={<MailSenderPage />} />
            <Route path={APP_ROUTES.USER.HISTORY} element={<HistoryPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
