import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/lib/auth-context";
import { authSessionApi } from "@/lib/auth-session";

function readGitHubAuthFragment(hash: string) {
  const fragment = hash.startsWith("#") ? hash.slice(1) : hash;
  const params = new URLSearchParams(fragment);

  return {
    error: params.get("error"),
  };
}

export default function LoginGithubCallbackPage() {
  const navigate = useNavigate();
  const { setIsAuthenticated, setUser } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function finalizeGitHubSignIn() {
      for (let attempt = 0; attempt < 4; attempt += 1) {
        try {
          const session = await authSessionApi.getSession();
          if (cancelled) {
            return;
          }

          setUser(session);
          setIsAuthenticated(true);
          window.history.replaceState(null, "", "/login/github/callback");
          navigate("/dashboard", { replace: true });
          return;
        } catch {
          if (attempt < 3) {
            await new Promise((resolve) => window.setTimeout(resolve, 250));
            continue;
          }
        }
      }

      if (!cancelled) {
        setIsAuthenticated(false);
        setUser(null);
        setErrorMessage("GitHub sign-in did not return a complete session.");
      }
    }

    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (code && state) {
      const apiBaseUrl = import.meta.env.VITE_API_WEB_INFRA_URL;
      const backendCallbackUrl = new URL("auth/github/callback", `${apiBaseUrl.replace(/\/+$/, "")}/`);
      backendCallbackUrl.searchParams.set("code", code);
      backendCallbackUrl.searchParams.set("state", state);
      backendCallbackUrl.searchParams.set("redirect_uri", `${window.location.origin}/login/github/callback`);

      window.location.replace(backendCallbackUrl.toString());
      return;
    }

    const result = readGitHubAuthFragment(window.location.hash);

    if (result.error) {
      setIsAuthenticated(false);
      setUser(null);
      setErrorMessage(result.error);
      window.history.replaceState(null, "", "/login");
      return;
    }

    void finalizeGitHubSignIn();

    return () => {
      cancelled = true;
    };
  }, [navigate, setIsAuthenticated, setUser]);

  return (
    <div className="flex min-h-svh items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold">Finishing GitHub sign-in</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {errorMessage ?? "We're creating your session and sending you to the dashboard."}
        </p>
      </div>
    </div>
  );
}
