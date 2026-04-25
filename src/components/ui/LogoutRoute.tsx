// src/pages/Logout.tsx
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { authSessionApi } from "@/lib/auth-session"
import { useAuth } from "@/lib/auth-context"

export default function LogoutPage() {
  const navigate = useNavigate()
  const { setIsAuthenticated, setUser } = useAuth()

  useEffect(() => {
    authSessionApi.logout().catch((error) => {
      console.error("Logout failed:", error)
    }).finally(() => {
      setUser(null)
      setIsAuthenticated(false)
      navigate("/login", { replace: true })
    })
  }, [navigate, setIsAuthenticated, setUser])

  return null // or a spinner/loading screen if you want
}
