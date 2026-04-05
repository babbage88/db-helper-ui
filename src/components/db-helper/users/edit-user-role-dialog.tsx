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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RolesCrudService } from "@/lib/api/services/RolesCrudService";
import type { UpdateUserRoleMappingRequest } from "@/lib/api/models/UpdateUserRoleMappingRequest";
import type { UserRow } from "./user-columns";
import type { UserRoleDao } from "@/lib/api/models/UserRoleDao";
import { showSuccessToast, showErrorToast } from "@/lib/toast-utils";

const editUserRoleFormSchema = z.object({
  roleId: z.string().min(1, "Role is required"),
});

type EditUserRoleFormValues = z.infer<typeof editUserRoleFormSchema>;

interface EditUserRoleDialogProps {
  open: boolean;
  user: UserRow | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditUserRoleDialog({
  open,
  user,
  onOpenChange,
  onSuccess,
}: EditUserRoleDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [roles, setRoles] = React.useState<UserRoleDao[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = React.useState(false);

  const form = useForm<EditUserRoleFormValues>({
    resolver: zodResolver(editUserRoleFormSchema),
    defaultValues: {
      roleId: "",
    },
  });

  React.useEffect(() => {
    if (!open) {
      form.reset();
      setError(null);
      return;
    }

    const loadRoles = async () => {
      try {
        setIsLoadingRoles(true);
        const response = await RolesCrudService.getAllUserRoles();
        // Handle both array and object with array property
        const roleList = response.userRoles || (Array.isArray(response) ? response : []);
        setRoles(roleList);
      } catch (err) {
        console.error("Failed to load roles:", err);
        setError("Failed to load available roles");
      } finally {
        setIsLoadingRoles(false);
      }
    };

    loadRoles();
  }, [open, form]);

  const handleSubmit = async (data: EditUserRoleFormValues) => {
    if (!user) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const updateRequest: UpdateUserRoleMappingRequest = {
        targetUserId: user.userId,
        roleId: data.roleId,
      };

      console.log("Updating user role:", updateRequest);

      await RolesCrudService.updateUserRole(updateRequest);
      
      // Find the role name for the toast message
      const assignedRole = roles.find((r) => r.id === data.roleId);
      
      form.reset();
      onOpenChange(false);
      showSuccessToast(
        "Role assigned successfully",
        `${user.username} has been assigned the ${assignedRole?.roleName || "selected"} role.`
      );
      onSuccess();
    } catch (error: any) {
      console.error("Failed to update user role:", error);
      const errorMessage = error?.message || "Failed to update user role. Please try again.";
      setError(errorMessage);
      showErrorToast("Failed to assign role", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User Role</DialogTitle>
          <DialogDescription>
            Assign a role to the user "{user?.username}".
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
              name="roleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoadingRoles}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
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
              <Button type="submit" disabled={isSubmitting || isLoadingRoles}>
                {isSubmitting ? "Updating..." : "Assign Role"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
