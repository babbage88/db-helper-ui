/**
 * Debug utility to check and display user permissions
 * Use in console: checkUserPermissionDebug("Alter Users")
 */
import { UserCrudService } from "@/lib/api/services/UserCrudService";
import type { UserDao } from "@/lib/api/models/UserDao";

export async function checkUserPermissionDebug(permissionName: string) {
  try {
    const userId = localStorage.getItem("userId");
    console.log("=== Permission Debug ===");
    console.log("User ID:", userId);

    if (!userId) {
      console.warn("No user ID found in localStorage");
      return;
    }

    const response = await UserCrudService.getUserById(userId);
    console.log("Full API response:", response);

    // Handle response structure - user might be in body.user or just user
    const user = (response as any).body?.user || response.user as UserDao;
    console.log("Response structure:", { hasBody: !!(response as any).body, hasDirectUser: !!(response as any).user });
    console.log("User object:", user);
    console.log("User roles (raw):", user?.roles);
    console.log("User roles (array):", Array.isArray(user?.roles) ? user?.roles : [user?.roles]);

    if (user?.roles) {
      console.log("Checking roles:");
      const rolesArray = Array.isArray(user.roles) ? user.roles : [user.roles];
      rolesArray.forEach((role: any, index: number) => {
        console.log(`  [${index}] Role:`, role, `| Type:`, typeof role);
        console.log(`        Lowercase:`, String(role).toLowerCase());
        console.log(`        Includes "admin":`, String(role).toLowerCase().includes("admin"));
      });
    }

    const lowerPermissionName = permissionName.toLowerCase().replace(/\s+/g, "");
    console.log("Checking permission:", permissionName, "->", lowerPermissionName);

    const hasAdminRole = user?.roles?.some((role: any) => {
      const normalizedRole = String(role).toLowerCase().trim();
      const matches = 
        normalizedRole === "admin" ||
        normalizedRole === "administrator" ||
        normalizedRole.includes("admin");
      console.log(`    Role "${role}" matches:`, matches);
      return matches;
    });

    console.log("Has Admin role:", hasAdminRole);
    console.log("======================");
  } catch (error) {
    console.error("Debug error:", error);
  }
}

// Make it globally available
if (typeof window !== "undefined") {
  (window as any).checkUserPermissionDebug = checkUserPermissionDebug;
}
