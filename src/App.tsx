// src/App.tsx

import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { PostgresUrlBuilder } from "./components/PostgresURLBuilder"
import { DbUserSetup } from "./components/DbUserSetup"
import { ThemeProvider } from "./components/ui/theme-provider"
import { ModeToggle } from "./components/ui/mode-toggle"
import { Toaster } from "@/components/ui/sonner"
import { NavMenu } from "@/components/db-helper/NavMenu"


export default function App() {
  return (
    <>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <ModeToggle></ModeToggle>
        <NavMenu></NavMenu>
        <Toaster />
        <Router>
          <Routes>
            <Route path="/" element={<PostgresUrlBuilder />} />
            <Route path="/pgurlbuilder" element={<PostgresUrlBuilder />} />
            <Route path="/dbusersetup" element={<DbUserSetup />} />
            <Route path="/scripts" element={<DbUserSetup />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </>

  )
}
