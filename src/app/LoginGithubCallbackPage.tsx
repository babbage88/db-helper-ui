import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { TokenService } from "@/lib/tokenManager";
import { useAuth } from "@/lib/auth-context";

function readGitHubAuthFragment(hash: string) {
  const fragment = hash.startsWith("#") ? hash.slice(1) : hash;
  const params = new URLSearchParams(fragment);

  return {
    accessToken: params.get("accessToken"),
    refreshToken: params.get("refreshToken"),
    userId: params.get("user_id"),
    username: params.get("userName"),
    email: params.get("email"),
    error: params.get("error"),
  };
}

export default function LoginGithubCallbackPage() {
  const navigate = useNavigate();
  const { setIsAuthenticated } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const result = readGitHubAuthFragment(window.location.hash);

    if (result.error) {
      setIsAuthenticated(false);
      setErrorMessage(result.error);
      window.history.replaceState(null, "", "/login");
      return;
    }

    if (!result.accessToken || !result.refreshToken || !result.userId) {
      setIsAuthenticated(false);
      setErrorMessage("GitHub sign-in did not return a complete session.");
      return;
    }

    TokenService.setAccessToken(result.accessToken);
    TokenService.setRefreshToken(result.refreshToken);
    TokenService.setUserInfo(result.userId, result.username ?? "", result.email ?? "");
    setIsAuthenticated(true);

    window.history.replaceState(null, "", "/login/github/callback");
    navigate("/dashboard", { replace: true });
  }, [navigate, setIsAuthenticated]);

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
