import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import {
  useCallback,
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
import LoginGithubCallbackPage from "@/app/LoginGithubCallbackPage";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import LogoutPage from "./components/ui/LogoutRoute";
import { AuthContext } from "@/lib/auth-context";
import ManageNodesPage from "@/app/nodes/manage/page";
import ProxmoxManagerPage from "@/app/nodes/manage/proxmox-manager-page";
import ManageSshKeysPage from "@/app/keys/manage/page";
import ManageUserSecretsPage from "@/app/user_secrets/manage/page";
import ManageStoragePage from "@/app/storage/manage/page";
import ManageUsersPage from "@/app/users/manage/page";
import ManageRolesPage from "@/app/roles/manage/page";
import ManageUserApplicationsPage from "@/app/user_applications/manage/page";
import { PermissionProtectedRoute } from "@/components/permission-protected-route";

import clsx from "clsx";
import { authSessionApi, type SessionUser } from "@/lib/auth-session";
import "@/lib/configure-api";

// Import permission debug utility
import "@/lib/permission-debug";

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
  const [user, setUser] = useState<SessionUser | null>(null);

  const refreshSession = useCallback(async () => {
    try {
      const session = await authSessionApi.getSession();
      setUser(session);
      setIsAuthenticated(true);
      return session;
    } catch {
      setUser(null);
      setIsAuthenticated(false);
      return null;
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      await refreshSession();
    };

    checkAuth();
  }, [refreshSession]);

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center h-screen text-xl font-semibold">
        Checking session...
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, setIsAuthenticated, user, setUser, refreshSession }}
    >
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        {/* Hidden element to force Tailwind v4 to generate data-active classes */}
        <div className="hidden data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground" />
        <Router>
          <SidebarProvider>
            <Toaster />
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/login/github/callback" element={<LoginGithubCallbackPage />} />
              <Route path="/auth/github/callback" element={<LoginGithubCallbackPage />} />
              <Route path="/logout" element={<LogoutPage />} />

              <Route
                path="/console/proxmox/:nodeId"
                element={
                  <ProtectedRoute>
                    <ProxmoxManagerPage />
                  </ProtectedRoute>
                }
              />

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
                <Route path="/nodes/proxmox" element={<ProxmoxManagerPage />} />
                <Route path="/nodes/manage/:nodeId/proxmox" element={<ProxmoxManagerPage />} />
                <Route path="/keys/manage" element={<ManageSshKeysPage />} />
                <Route path="/secrets/manage" element={<ManageUserSecretsPage />} />
                <Route path="/applications/manage" element={<ManageUserApplicationsPage />} />
                <Route path="/storage/manage" element={<ManageStoragePage />} />
                <Route
                  path="/users/manage"
                  element={
                    <PermissionProtectedRoute permission="Alter Users">
                      <ManageUsersPage />
                    </PermissionProtectedRoute>
                  }
                />
                <Route
                  path="/roles/manage"
                  element={
                    <PermissionProtectedRoute permission="Alter Users">
                      <ManageRolesPage />
                    </PermissionProtectedRoute>
                  }
                />
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
    </div>
  );
}
