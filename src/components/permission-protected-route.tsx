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
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">
            You do not have permission to access this page.
          </p>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>
      </div>
    );
  }

  return children;
}
