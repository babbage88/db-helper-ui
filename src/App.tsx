// src/App.tsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type JSX,
} from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { PostgresUrlBuilder } from "./components/db-helper/PostgresURLBuilder";
import DocsMarkdown from "./components/docs/GettingStartedDoc";
import { DbUserSetup } from "./components/db-helper/GeneratePgDevDbSetupScripts";
import { ThemeProvider } from "./components/ui/theme-provider";
import { ModeToggle } from "./components/ui/mode-toggle";
import { Toaster } from "@/components/ui/sonner";
import { CertificateRequestForm } from "@/components/web-infra/CfCerts";
import { Dashboard } from "@/components/ui/BobDashboard";
import LoginPage from "@/app/LoginPage";
import { AuthenticationService, type TokenRefreshReq } from "@/lib/api";
import { OpenAPI } from "@/lib/api";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import LogoutPage from "./components/ui/LogoutRoute";

// Auth Context
const AuthContext = createContext<{ isAuthenticated: boolean | null }>({
  isAuthenticated: null,
});

OpenAPI.TOKEN = localStorage.getItem("accessToken") || "";

function useAuth() {
  return useContext(AuthContext);
}

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated === null) {
    return <div className="text-center p-4">Checking session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to={"/login"} replace />;
  }

  return children;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");

    const tryRefresh = async () => {
      if (!refreshToken) return false;
      try {
        const refReq: TokenRefreshReq = { refreshToken };
        const response = await AuthenticationService.refreshAccessToken(refReq);
        localStorage.setItem("accessToken", response.accessToken!);
        localStorage.setItem("refreshToken", response.refreshToken!);
        OpenAPI.TOKEN = response.accessToken!;
        return true;
      } catch (err) {
        console.error("Error refreshing token:", err);
        return false;
      }
    };

    const checkAuth = async () => {
      if (!token) {
        const refreshed = await tryRefresh();
        setIsAuthenticated(refreshed);
        return;
      }

      OpenAPI.TOKEN = token;
      try {
        await AuthenticationService.verifyToken();
        setIsAuthenticated(true);
      } catch {
        const refreshed = await tryRefresh();
        setIsAuthenticated(refreshed);
      }
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center h-screen text-xl font-semibold">
        Checking session...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated }}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Router>
          <SidebarProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/logout" element={<LogoutPage />} />

              {/* Protected layout route */}
              <Route
                element={
                  <ProtectedRoute>
                    <div className="flex min-h-screen w-full">
                      <div className="w-64 shrink-0 ">
                        <AppSidebar />
                      </div>
                      <div className="flex flex-col flex-1">
                        <header className="flex items-center justify-end px-4 py-2">
                          <SidebarTrigger />
                          <ModeToggle />
                        </header>
                        <main className="flex-1 overflow-auto p-4">
                          <Outlet />
                        </main>
                      </div>
                      <Toaster />
                    </div>
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/pgurlbuilder" element={<PostgresUrlBuilder />} />
                <Route path="/dbusersetup" element={<DbUserSetup />} />
                <Route path="/scripts" element={<DbUserSetup />} />
                <Route path="/docs" element={<DocsMarkdown />} />
                <Route path="/cert-renew" element={<CertificateRequestForm />} />
              </Route>
            </Routes>
          </SidebarProvider>
        </Router>
      </ThemeProvider>
    </AuthContext.Provider>
  );
}
