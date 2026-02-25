import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { UserLayout } from "@/components/common/UserLayout";
import UserDashboard from "@/pages/user/Dashboard";
import MailSenderPage from "@/pages/user/MailSender";
import HistoryPage from "@/pages/user/History";
import { APP_ROUTES } from "@/constants/routes";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect root to user dashboard */}
        <Route path={APP_ROUTES.HOME} element={<Navigate to={APP_ROUTES.USER.DASHBOARD} replace />} />

        {/* User section — wrapped with sidebar layout */}
        <Route element={<UserLayout />}>
          <Route path={APP_ROUTES.USER.DASHBOARD} element={<UserDashboard />} />
          <Route path={APP_ROUTES.USER.MAIL_SENDER} element={<MailSenderPage />} />
          <Route path={APP_ROUTES.USER.HISTORY} element={<HistoryPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
