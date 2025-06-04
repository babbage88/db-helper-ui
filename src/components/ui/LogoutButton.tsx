"use client"

import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button" // optional: ShadCN UI
import { LogOutIcon } from "lucide-react"
import { TokenService } from "@/lib/tokenManager"

export function LogoutButton() {
  const navigate = useNavigate()

  const handleLogout = () => {
    TokenService.clearTokens()
    TokenService.clearUserInfo()
    // You can also clear any other app-specific state here

    navigate("/login", { replace: true })
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
