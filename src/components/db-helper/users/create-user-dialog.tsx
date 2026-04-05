"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserCrudService } from "@/lib/api/services/UserCrudService";
import { RolesCrudService } from "@/lib/api/services/RolesCrudService";
import type { CreateNewUserRequest } from "@/lib/api/models/CreateNewUserRequest";
import type { UserRoleDao } from "@/lib/api/models/UserRoleDao";
import type { UpdateUserRoleMappingRequest } from "@/lib/api/models/UpdateUserRoleMappingRequest";
import { showSuccessToast, showErrorToast } from "@/lib/toast-utils";

const createUserFormSchema = z.object({
  newUsername: z.string().min(1, "Username is required"),
  newEmail: z.string().email("Invalid email address"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  passwordConfirm: z.string(),
  roleId: z.string().optional(),
}).refine((data) => data.newPassword === data.passwordConfirm, {
  message: "Passwords don't match",
  path: ["passwordConfirm"],
});

type CreateUserFormValues = z.infer<typeof createUserFormSchema>;

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateUserDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [roles, setRoles] = React.useState<UserRoleDao[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = React.useState(false);

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserFormSchema),
    defaultValues: {
      newUsername: "",
      newEmail: "",
      newPassword: "",
      passwordConfirm: "",
      roleId: "",
    },
  });

  React.useEffect(() => {
    if (!open) {
      setError(null);
      return;
    }

    const loadRoles = async () => {
      try {
        setIsLoadingRoles(true);
        const response = await RolesCrudService.getAllUserRoles();
        // Handle response wrapping - roles come as body.userRoles
        const roleList = (response as any).body?.userRoles || (response as any).userRoles || (Array.isArray(response) ? response : []);
        setRoles(roleList);
      } catch (err) {
        console.error("Failed to load roles:", err);
        setError("Failed to load available roles");
      } finally {
        setIsLoadingRoles(false);
      }
    };

    loadRoles();
  }, [open]);

  const handleSubmit = async (data: CreateUserFormValues) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const createUserRequest: CreateNewUserRequest = {
        newUsername: data.newUsername,
        newEmail: data.newEmail,
        newPassword: data.newPassword,
      };

      console.log("Creating new user:", {
        ...createUserRequest,
        newPassword: "[REDACTED]",
      });

      const userResponse = await UserCrudService.createUser(createUserRequest);
      const userId = (userResponse as any).body?.id || (userResponse as any).id;

      // If a role was selected, assign it to the new user
      if (data.roleId && userId) {
        try {
          const updateRequest: UpdateUserRoleMappingRequest = {
            targetUserId: userId,
            roleId: data.roleId,
          };
          await RolesCrudService.updateUserRole(updateRequest);
          const assignedRole = roles.find((r) => r.id === data.roleId);
          showSuccessToast(
            "User created successfully",
            `${data.newUsername} has been added and assigned the ${assignedRole?.roleName || "selected"} role.`
          );
        } catch (roleError: any) {
          console.error("Failed to assign role:", roleError);
          showErrorToast(
            "User created but role assignment failed",
            "The user was created but the role assignment failed. You can assign the role later."
          );
        }
      } else {
        showSuccessToast(
          "User created successfully",
          `${data.newUsername} has been added to the system.`
        );
      }

      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Failed to create user:", error);
      const errorMessage = error?.message || "Failed to create user. Please try again.";
      setError(errorMessage);
      showErrorToast("Failed to create user", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Add a new user account to the system.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <FormField
              control={form.control}
              name="newUsername"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="john.doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="passwordConfirm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="roleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign Role (Optional)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoadingRoles}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id || ""}>
                          {role.roleName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
