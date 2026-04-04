import { useEffect, useState, type JSX } from "react";
import { checkUserPermission } from "@/lib/permission-utils";

interface PermissionProtectedRouteProps {
  children: JSX.Element;
  permission: string;
}

export function PermissionProtectedRoute({
  children,
  permission,
}: PermissionProtectedRouteProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const result = await checkUserPermission(permission);
        setHasPermission(result);
      } catch (err) {
        console.error("Error checking permission:", err);
        setError("Failed to check permissions");
        setHasPermission(false);
      }
    };

    checkPermission();
  }, [permission]);

  if (hasPermission === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-muted-foreground mb-4">
            You do not have the required permission to access this page.
          </p>
          <p className="text-sm text-muted-foreground">
            Required permission: <span className="font-mono font-semibold">{permission}</span>
          </p>
          {error && (
            <p className="text-sm text-red-600 mt-4">{error}</p>
          )}
          <p className="text-xs text-muted-foreground mt-6">
            Please check the browser console for more details about permission checking.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
