"use client"

import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button" // optional: ShadCN UI
import { LogOutIcon } from "lucide-react"
import { authSessionApi } from "@/lib/auth-session"
import { useAuth } from "@/lib/auth-context"

export function LogoutButton() {
  const navigate = useNavigate()
  const { setIsAuthenticated, setUser } = useAuth()

  const handleLogout = async () => {
    try {
      await authSessionApi.logout()
    } catch (error) {
      console.error("Logout failed:", error)
    } finally {
      setUser(null)
      setIsAuthenticated(false)
      navigate("/login", { replace: true })
    }
  }

  return (
    <Button
      variant="ghost"
      onClick={handleLogout}
      className="flex items-center space-x-2"
    >
      <LogOutIcon className="h-4 w-4" />
      <span>Logout</span>
    </Button>
  )
}
