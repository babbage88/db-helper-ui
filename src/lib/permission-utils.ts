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
    const user = response.user as UserDao;

    if (!user || !user.roles) {
      return false;
    }

    // In a production app, you'd check the actual permissions from the backend
    // For now, we'll use a simple role-based check
    // For the "Alter Users" permission, we can check if user is admin or has explicit permission
    if (permissionName.toLowerCase() === "alter users") {
      // Check if user has admin role or similar
      return user.roles.some(
        (role) =>
          role.toLowerCase() === "admin" ||
          role.toLowerCase() === "administrator"
      );
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
