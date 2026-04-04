import React from "react";
import { UserCrudService } from "@/lib/api/services/UserCrudService";
import type { UserDao } from "@/lib/api/models/UserDao";

/**
 * Check if the current user has a specific permission
 */
export async function checkUserPermission(
  permissionName: string
): Promise<boolean> {
  try {
    // Get the current user info from localStorage
    const userId = localStorage.getItem("userId");
    if (!userId) {
      console.warn("No user ID found in localStorage");
      return false;
    }

    // Fetch user details including roles
    const response = await UserCrudService.getUserById(userId);
    // Handle response structure - user might be in body.user or just user
    const user = (response as any).body?.user || response.user as UserDao;

    console.log("Response structure:", { hasBody: !!(response as any).body, hasDirectUser: !!(response as any).user });
    console.log("Extracted user:", user);

    if (!user || !user.roles) {
      console.warn("No user or roles found in response");
      console.log("User:", user);
      return false;
    }

    console.log("Checking permission:", permissionName);
    console.log("User roles:", user.roles);

    // Check for "Alter Users" / "AlterUsers" permission via Admin role
    const lowerPermissionName = permissionName.toLowerCase().replace(/\s+/g, "");
    const isAlterUsersPermission = 
      lowerPermissionName === "alterusers" || 
      lowerPermissionName === "alter users";

    if (isAlterUsersPermission) {
      // Check if user has admin role (case-insensitive and handles various formats)
      const hasAdminRole = user.roles.some((role: any) => {
        const normalizedRole = String(role).toLowerCase().trim();
        return (
          normalizedRole === "admin" ||
          normalizedRole === "administrator" ||
          normalizedRole.includes("admin")
        );
      });

      console.log("Has Admin role:", hasAdminRole);
      return hasAdminRole;
    }

    return false;
  } catch (error) {
    console.error("Error checking user permission:", error);
    return false;
  }
}

/**
 * Hook for checking user permissions
 */
export function useUserPermission(permissionName: string) {
  const [hasPermission, setHasPermission] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const checkPermission = async () => {
      try {
        setIsLoading(true);
        const result = await checkUserPermission(permissionName);
        setHasPermission(result);
      } finally {
        setIsLoading(false);
      }
    };

    checkPermission();
  }, [permissionName]);

  return { hasPermission, isLoading };
}
