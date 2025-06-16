"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Control, type Resolver } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import * as z from "zod";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";

const nodeFormSchema = z.object({
  hostname: z.string().min(1, "Hostname is required"),
  ipAddress: z.string().min(1, "IP Address is required"),
  username: z.string().min(1, "Username is required"),
  publicSshKeyname: z.string().min(1, "SSH Key name is required"),
  isContainerHost: z.boolean().default(false),
  isVirtualMachine: z.boolean().default(false),
  isVmHost: z.boolean().default(false),
  idDbHost: z.boolean().default(false),
});

type NodeFormValues = z.infer<typeof nodeFormSchema>;

interface AddNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: NodeFormValues) => void;
}

export function AddNodeDialog({
  open,
  onOpenChange,
  onSubmit,
}: AddNodeDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const resolver: Resolver<NodeFormValues> = zodResolver(nodeFormSchema);

  const form = useForm<NodeFormValues>({
    resolver,
    defaultValues: {
      hostname: "",
      ipAddress: "",
      username: "",
      publicSshKeyname: "",
      isContainerHost: false,
      isVirtualMachine: false,
      isVmHost: false,
      idDbHost: false,
    },
  });

  const handleSubmit: SubmitHandler<NodeFormValues> = async (data) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      form.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  const control: Control<NodeFormValues> = form.control;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Node</DialogTitle>
          <DialogDescription>
            Add a new server to your managed nodes inventory.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={control}
              name="hostname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hostname</FormLabel>
                  <FormControl>
                    {isSubmitting ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Input placeholder="server.example.com" {...field} />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="ipAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IP Address</FormLabel>
                  <FormControl>
                    {isSubmitting ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Input placeholder="192.168.1.1" {...field} />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    {isSubmitting ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Input placeholder="root" {...field} />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="publicSshKeyname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SSH Key Name</FormLabel>
                  <FormControl>
                    {isSubmitting ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Input placeholder="id_rsa" {...field} />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={control}
                name="isContainerHost"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      {isSubmitting ? (
                        <Skeleton className="h-4 w-4" />
                      ) : (
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    </FormControl>
                    <FormLabel>Container Host</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="isVirtualMachine"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      {isSubmitting ? (
                        <Skeleton className="h-4 w-4" />
                      ) : (
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    </FormControl>
                    <FormLabel>Virtual Machine</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="isVmHost"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      {isSubmitting ? (
                        <Skeleton className="h-4 w-4" />
                      ) : (
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    </FormControl>
                    <FormLabel>VM Host</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="idDbHost"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      {isSubmitting ? (
                        <Skeleton className="h-4 w-4" />
                      ) : (
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    </FormControl>
                    <FormLabel>DB Host</FormLabel>
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Node"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 