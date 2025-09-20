import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import {
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
import { AuthenticationService } from "@/lib/api";
import { OpenAPI } from "@/lib/api";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import LogoutPage from "./components/ui/LogoutRoute";
import { AuthContext } from "@/lib/auth-context";
import ManageNodesPage from "@/app/nodes/manage/page";
import ManageSshKeysPage from "@/app/keys/manage/page";
import ManageUserSecretsPage from "@/app/user_secrets/manage/page";

import clsx from "clsx";

OpenAPI.TOKEN = localStorage.getItem("accessToken") || "";

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

import { useAuth } from "@/lib/auth-context";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    const checkAuth = async () => {
      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      try {
        // We assume the token is valid initially. 
        // The interceptor will handle 401s if it's not.
        await AuthenticationService.verifyToken();
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
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
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated }}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        {/* Hidden element to force Tailwind v4 to generate data-active classes */}
        <div className="hidden data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground" />
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
                    <SidebarResponsiveLayout />
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
                <Route path="/nodes/manage" element={<ManageNodesPage />} />
                <Route path="/keys/manage" element={<ManageSshKeysPage />} />
                <Route path="/secrets/manage" element={<ManageUserSecretsPage />} />
              </Route>
            </Routes>
          </SidebarProvider>
        </Router>
      </ThemeProvider>
    </AuthContext.Provider>
  );
}

function SidebarResponsiveLayout() {
  const { state } = useSidebar();
  return (
    <div className="min-h-screen w-full">
      <div
        className={clsx(
          "hidden sm:block shrink-0 transition-all duration-200",
          state === "collapsed" ? "w-16" : "w-64 border-r"
        )}
      >
        <AppSidebar />
      </div>
      <div className={clsx(
        "flex flex-col min-h-screen transition-all duration-200",
        state === "collapsed" ? "sm:ml-16" : "sm:ml-64"
      )}>
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
  );
}
