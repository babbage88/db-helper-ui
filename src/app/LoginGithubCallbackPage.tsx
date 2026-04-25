import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/lib/auth-context";

function readGitHubAuthFragment(hash: string) {
  const fragment = hash.startsWith("#") ? hash.slice(1) : hash;
  const params = new URLSearchParams(fragment);

  return {
    error: params.get("error"),
  };
}

export default function LoginGithubCallbackPage() {
  const navigate = useNavigate();
  const { refreshSession, setIsAuthenticated } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
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
      setErrorMessage(result.error);
      window.history.replaceState(null, "", "/login");
      return;
    }

    refreshSession()
      .then((session) => {
        if (!session) {
          setErrorMessage("GitHub sign-in did not return a complete session.");
          return;
        }

        window.history.replaceState(null, "", "/login/github/callback");
        navigate("/dashboard", { replace: true });
      })
      .catch(() => {
        setIsAuthenticated(false);
        setErrorMessage("GitHub sign-in did not return a complete session.");
      });
  }, [navigate, refreshSession, setIsAuthenticated]);

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
