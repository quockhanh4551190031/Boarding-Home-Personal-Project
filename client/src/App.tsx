import { Routes, Route, NavLink } from "react-router-dom";
import { LoginPage } from "./features/auth/pages/LoginPage";
import { RegisterPage } from "./features/auth/pages/RegisterPage";

function App() {
  return (
    <div className="min-h-screen bg-background">
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

      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </div>
  );
}

export default App;
