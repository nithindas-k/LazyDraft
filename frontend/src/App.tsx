import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { UserLayout } from "@/components/common/UserLayout";
import UserDashboard from "@/pages/user/Dashboard";
import MailSenderPage from "@/pages/user/MailSender";
import RecurringMailPage from "@/pages/user/RecurringMail";
import HistoryPage from "@/pages/user/History";
import SettingsPage from "@/pages/user/Settings";
import TemplatesPage from "@/pages/user/Templates";
import ServicesPage from "@/pages/user/Services";
import LoginPage from "@/pages/auth/Login";
import VerifyEmailPage from "@/pages/auth/VerifyEmail";
import { APP_ROUTES } from "@/constants/routes";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Checking authentication...</p>
      </div>
    );
  }

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
          <Route path={APP_ROUTES.VERIFY_EMAIL} element={<VerifyEmailPage />} />

          {/* Redirect root to user dashboard */}
          <Route path={APP_ROUTES.HOME} element={<Navigate to={APP_ROUTES.USER.DASHBOARD} replace />} />

          {/* User section — wrapped with sidebar layout and ProtectedRoute */}
          <Route element={<ProtectedRoute><UserLayout /></ProtectedRoute>}>
            <Route path={APP_ROUTES.USER.DASHBOARD} element={<UserDashboard />} />
            <Route path={APP_ROUTES.USER.MAIL_SENDER} element={<MailSenderPage />} />
            <Route path={APP_ROUTES.USER.RECURRING_MAIL} element={<RecurringMailPage />} />
            <Route path={APP_ROUTES.USER.SERVICES} element={<ServicesPage />} />
            <Route path={APP_ROUTES.USER.HISTORY} element={<HistoryPage />} />
            <Route path={APP_ROUTES.USER.SETTINGS} element={<SettingsPage />} />
            <Route path={APP_ROUTES.USER.TEMPLATES} element={<TemplatesPage />} />
          </Route>
        </Routes>

        {/* Global toast notifications */}
        <Toaster
          position="top-center"
          closeButton={false}
          offset={16}
          expand={false}
          visibleToasts={3}
          gap={8}
          toastOptions={{
            style: {
              fontFamily: "inherit",
              fontSize: "13px",
              width: "min(94vw, 430px)",
              borderRadius: "24px",
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
