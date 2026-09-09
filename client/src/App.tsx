import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import { LoginPage } from "./features/auth/pages/LoginPage";
import { RegisterPage } from "./features/auth/pages/RegisterPage";
import { OnboardingPage } from "./features/onboarding/pages/OnboardingPage";
import { HomePage } from "./features/home/pages/HomePage";
import { ProtectedRoute } from "./features/auth/components/ProtectedRoute";
import { useAuth } from "./features/auth/AuthContext";

function App() {
  const { session, profileReady, loading } = useAuth();
  const location = useLocation();

  // Ẩn nav trên các trang cần tập trung (onboarding) hoặc đã đăng nhập (home).
  const isMinimalPage =
    location.pathname === "/onboarding" ||
    location.pathname === "/home" ||
    (session && profileReady && !loading);

  return (
    <div className="min-h-screen bg-background">
      {!isMinimalPage && (
        <nav className="flex justify-center gap-6 border-b border-border p-3 text-sm">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive
                ? "font-semibold text-primary"
                : "text-muted-foreground hover:text-foreground"
            }
          >
            Đăng nhập
          </NavLink>
          <NavLink
            to="/register"
            className={({ isActive }) =>
              isActive
                ? "font-semibold text-primary"
                : "text-muted-foreground hover:text-foreground"
            }
          >
            Đăng ký
          </NavLink>
        </nav>
      )}

      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Cần đăng nhập nhưng KHÔNG cần profile complete */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute requireCompleteProfile={false}>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />

        {/* Cần đăng nhập VÀ profile complete (mặc định) */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
