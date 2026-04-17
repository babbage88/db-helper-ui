import { GalleryVerticalEnd } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { useNavigate } from "react-router-dom";
import { AuthenticationService } from "@/lib/api";
import type { FormEvent } from "react";
import mascot from "@/assets/DbBobMaskot.sky.svg";
import { TokenService } from "@/lib/tokenManager";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { useContext, useState } from "react";
import { AuthContext } from "@/lib/auth-context";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setIsAuthenticated } = useContext(AuthContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email")?.toString() || "";
    const password = formData.get("password")?.toString() || "";

    try {
      const data = await AuthenticationService.localLogin({ username: email, password });
      const { accessToken, refreshToken } = data;

      if (!accessToken || !refreshToken) {
        throw new Error("Invalid response from server");
      }

      const currentUserId = data.user_id ?? "";
      const username = data.userName ?? "";
      const userEmail = data.email ?? "";

      TokenService.setAccessToken(accessToken);
      TokenService.setRefreshToken(refreshToken);
      TokenService.setUserInfo(currentUserId, username, userEmail);

      setIsAuthenticated(true); 
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Login error:", err.message);
      setErrorMessage("We couldn't sign you in with that email and password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleGitHubLogin() {
    setErrorMessage(null);
    setIsSubmitting(true);

    const apiBaseUrl = import.meta.env.VITE_API_WEB_INFRA_URL;
    const callbackUrl = `${window.location.origin}/login/github/callback`;
    const startUrl = new URL("auth/github/start", `${apiBaseUrl.replace(/\/+$/, "")}/`);
    startUrl.searchParams.set("redirect_uri", callbackUrl);

    window.location.assign(startUrl.toString());
  }

  return (
    <div className="relative min-h-svh">
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
              <LoginForm
                onSubmit={handleLoginSubmit}
                onGitHubLogin={handleGitHubLogin}
                isSubmitting={isSubmitting}
                errorMessage={errorMessage}
              />
            </div>
          </div>
        </div>

        <div className="relative hidden lg:flex items-center justify-center p-8">
          <img
            src={mascot}
            alt="DbBob mascot"
            className="h-full w-full max-h-[500px] object-contain dark:brightness-[0.7]"
          />
        </div>
      </div>
    </div>
  );
}
