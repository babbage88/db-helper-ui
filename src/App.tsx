// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { PostgresUrlBuilder } from "./components/db-helper/PostgresURLBuilder";
import DocsMarkdown from "./components/docs/GettingStartedDoc";
import { DbUserSetup } from "./components/db-helper/GeneratePgDevDbSetupScripts";
import { ThemeProvider } from "./components/ui/theme-provider";
import { ModeToggle } from "./components/ui/mode-toggle";
import { Toaster } from "@/components/ui/sonner";
import { NavMenu } from "@/components/db-helper/NavMenu";
import { CertificateRequestForm } from "@/components/web-infra/CfCerts";
import { Dashboard } from "@/components/ui/BobDashboard";
import LoginPage from "@/app/LoginPage";
import { AuthenticationService } from "@/lib/api";
import { OpenAPI } from "@/lib/api";
import { useEffect, useState, type JSX } from "react";

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const [isValid, setIsValid] = useState<null | boolean>(null);

  useEffect(() => {
    const check = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setIsValid(false);
        return;
      }

      try {
        OpenAPI.TOKEN = token;
        await AuthenticationService.verifyToken();
        setIsValid(true);
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userId");
        setIsValid(false);
      }
    };
    check();
  }, []);

  if (isValid === null) {
    return <div className="text-center p-4">Checking session...</div>;
  }

  if (!isValid) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  const token = localStorage.getItem("accessToken");
  if (token) {
    OpenAPI.TOKEN = token;
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Router>
        <div className="flex justify-between items-center px-4 py-2">
          <NavMenu />
          <ModeToggle />
        </div>
        <Toaster />

        <Routes>
          <Route path="/login" element={<LoginPage />} />
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
      </Router>
    </ThemeProvider>
  );
}
