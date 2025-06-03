// src/App.tsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type JSX,
} from "react";

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
import { SidebarProvider } from "@/components/ui/sidebar";

// Auth Context
const AuthContext = createContext<{ isAuthenticated: boolean | null }>({
  isAuthenticated: null,
});

function useAuth() {
  return useContext(AuthContext);
}

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated === null) {
    return <div className="text-center p-4">Checking session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setIsAuthenticated(false);
        return;
      }
      try {
        OpenAPI.TOKEN = token;
        await AuthenticationService.verifyToken();
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userId");
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
    <AuthContext.Provider value={{ isAuthenticated }}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Router>
          {isAuthenticated ? (
            <SidebarProvider>
              <div className="flex min-h-screen w-full">
                <aside className="w-64 shrink-0 border-r border-border">
                  <AppSidebar />
                </aside>

                <div className="flex flex-col flex-1">
                  <header className="flex items-center justify-end px-4 py-2">
                    <ModeToggle />
                  </header>

                  <main className="flex-1 overflow-auto p-4">
                    <Routes>
                      <Route
                        path="/"
                        element={
                          <ProtectedRoute>
                            <Dashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/dashboard"
                        element={
                          <ProtectedRoute>
                            <Dashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/pgurlbuilder"
                        element={
                          <ProtectedRoute>
                            <PostgresUrlBuilder />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/dbusersetup"
                        element={
                          <ProtectedRoute>
                            <DbUserSetup />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/scripts"
                        element={
                          <ProtectedRoute>
                            <DbUserSetup />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/docs"
                        element={
                          <ProtectedRoute>
                            <DocsMarkdown />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/cert-renew"
                        element={
                          <ProtectedRoute>
                            <CertificateRequestForm />
                          </ProtectedRoute>
                        }
                      />
                    </Routes>
                  </main>
                </div>
              </div>
              <Toaster />
            </SidebarProvider>
          ) : (
            <>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
              </Routes>
              <Toaster />
            </>
          )}
        </Router>
      </ThemeProvider>
    </AuthContext.Provider>
  );
}
