// src/App.tsx

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { PostgresUrlBuilder } from "./components/db-helper/PostgresURLBuilder";
import  DocsMarkdown  from "./components/docs/GettingStartedDoc"
import { DbUserSetup } from "./components/db-helper/GeneratePgDevDbSetupScripts";
import { ThemeProvider } from "./components/ui/theme-provider";
import { ModeToggle } from "./components/ui/mode-toggle";
import { Toaster } from "@/components/ui/sonner";
import { NavMenu } from "@/components/db-helper/NavMenu";
import { CertificateRequestForm } from "@/components/web-infra/CfCerts";
import { Dashboard } from "@/components/ui/BobDashboard";
import { Login } from "@/components/ui/Login";

export default function App() {
  return (
    <>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <div className="flex justify-between items-center px-4 py-2">
          <NavMenu />
          <ModeToggle />
        </div>
        <Toaster />
        <Router>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pgurlbuilder" element={<PostgresUrlBuilder />} />
            <Route path="/dbusersetup" element={<DbUserSetup />} />
            <Route path="/scripts" element={<DbUserSetup />} />
            <Route path="/docs" element={<DocsMarkdown />} />
            <Route path="/cert-renew" element={<CertificateRequestForm />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </>
  );
}
