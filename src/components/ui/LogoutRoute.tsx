// src/pages/Logout.tsx
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { TokenService } from "@/lib/tokenManager"

export default function LogoutPage() {
  const navigate = useNavigate()

  useEffect(() => {
    TokenService.clearTokens()
    TokenService.clearUserInfo()

    navigate("/login", { replace: true })
  }, [navigate])

  return null // or a spinner/loading screen if you want
}
