import { Network } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { useNavigate } from "react-router-dom";
import { AuthenticationService } from "@/lib/api";
import type { FormEvent } from "react";
import mascot from "@/assets/InfraCtlMark.sky.svg";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { useContext, useState } from "react";
import { AuthContext } from "@/lib/auth-context";

export default function LoginPage() {
  const navigate = useNavigate();
  const { refreshSession } = useContext(AuthContext);
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
      if (!data.user_id) {
        throw new Error("Invalid response from server");
      }

      await refreshSession();
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
    <div className="relative min-h-svh overflow-hidden bg-background">
      <div className="fixed top-4 right-4 z-50">
        <ModeToggle />
      </div>

      <div className="absolute left-6 top-6 z-10 flex items-center gap-2 font-medium md:left-10 md:top-10">
        <div className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md">
          <Network className="size-4" />
        </div>
        infractl
      </div>

      <main className="grid min-h-svh md:grid-cols-[minmax(340px,40vw)_1fr]">
        <section className="flex items-center justify-center px-6 py-24 md:px-10">
          <div className="w-full max-w-sm">
            <LoginForm
              onSubmit={handleLoginSubmit}
              onGitHubLogin={handleGitHubLogin}
              isSubmitting={isSubmitting}
              errorMessage={errorMessage}
            />
          </div>
        </section>

        <section className="relative hidden min-h-svh overflow-hidden border-l bg-muted/20 md:flex md:items-center md:justify-center">
          <div className="absolute inset-0 opacity-70">
            <div className="absolute left-[18%] top-0 h-full w-px bg-border" />
            <div className="absolute left-[48%] top-0 h-full w-px bg-border" />
            <div className="absolute left-[78%] top-0 h-full w-px bg-border" />
            <div className="absolute left-0 top-[24%] h-px w-full bg-border" />
            <div className="absolute left-0 top-[52%] h-px w-full bg-border" />
            <div className="absolute left-0 top-[80%] h-px w-full bg-border" />
          </div>
          <img
            src={mascot}
            alt="infractl infrastructure control plane mark"
            className="relative h-auto w-[min(70vh,620px)] max-w-[82%] object-contain dark:brightness-[0.78]"
          />
        </section>
      </main>
    </div>
  );
}
