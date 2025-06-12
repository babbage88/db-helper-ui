import { GalleryVerticalEnd } from "lucide-react"
import { LoginForm } from "@/components/login-form";
import { useNavigate } from "react-router-dom";
import { AuthenticationService } from "@/lib/api";
import type { FormEvent } from "react";
import mascot from '@/assets/DbBobMaskot.sky.svg'
import { TokenService } from "@/lib/tokenManager";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const navigate = useNavigate();

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email")?.toString() || "";
    const password = formData.get("password")?.toString() || "";

    try {
      const data = await AuthenticationService.localLogin({ username: email, password });
      const { accessToken, refreshToken, user_id } = data;

      if (!accessToken || !refreshToken) {
        throw new Error("Invalid response from server");
      }

      const userId = user_id ?? "";
      const username = data.userName ?? "";
      const userEmail = data.email ?? "";

      TokenService.setAccessToken(accessToken);
      TokenService.setRefreshToken(refreshToken);
      TokenService.setUserInfo(userId, username, userEmail);

      navigate("/dashboard");
    } catch (err: any) {
      console.error("Login error:", err.message);
    }
  }

  return (
    <div className="relative min-h-svh">
      {/* ✅ This is now pinned to the screen's top-right */}
      <div className="fixed top-4 right-4 z-50">
        <ModeToggle />
      </div>

      <div className="grid min-h-svh lg:grid-cols-2">
        <div className="flex flex-col gap-4 p-6 md:p-10">
          <div className="flex items-center gap-2 font-medium p-4">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
            DbBob
          </div>

          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-xs">
              <form onSubmit={handleLoginSubmit}>
                <LoginForm />
                <Button type="submit" className="w-full mt-4">Login</Button>
              </form>
            </div>
          </div>
        </div>

        <div className="relative hidden lg:flex items-center justify-center p-8">
          <img
            src={mascot}
            alt="Image"
            className="h-full w-full max-h-[500px] object-contain dark:brightness-[0.7]"
          />
        </div>
      </div>
    </div>
  );
}
