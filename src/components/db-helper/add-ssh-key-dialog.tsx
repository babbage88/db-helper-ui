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
import { SshKeysService } from "@/lib/api/services/SshKeysService";
import type { CreateSshKeyRequest } from "@/lib/api/models/CreateSshKeyRequest";

const sshKeyFormSchema = z.object({
  name: z.string().min(1, "Key name is required"),
  keyType: z.string().min(1, "Key type is required"),
  privateKey: z.string().min(1, "Private key is required"),
  passphrase: z.string().optional(),
  publicKey: z.string().min(1, "Public key is required"),
  description: z.string().optional(),
});

type SshKeyFormValues = z.infer<typeof sshKeyFormSchema>;

interface AddSshKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddSshKeyDialog({ open, onOpenChange, onSuccess }: AddSshKeyDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<SshKeyFormValues>({
    resolver: zodResolver(sshKeyFormSchema),
    defaultValues: {
      name: "",
      keyType: "ed25519",
      privateKey: "",
      publicKey: "",
      description: "",
      passphrase: "",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        form.setValue(name as keyof SshKeyFormValues, event.target?.result as string);
      };
      reader.readAsText(files[0]);
    }
  };

  const handleSubmit = async (data: SshKeyFormValues) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      const sshKeyRequest: CreateSshKeyRequest = {
        name: data.name,
        privateKey: data.privateKey,
        passphrase: data.passphrase,
        publicKey: data.publicKey,
        keyType: data.keyType,
        description: data.description || `SSH key for general use`,
      };
      console.log("SSH key passphrase:", sshKeyRequest.passphrase);
      // Debug logging to see what's being sent
      console.log("Submitting SSH key request:", {
        ...sshKeyRequest,
        privateKey: sshKeyRequest.privateKey ? "[PRIVATE KEY CONTENT]" : "undefined",
        publicKey: sshKeyRequest.publicKey ? "[PUBLIC KEY CONTENT]" : "undefined",
        passphrase: sshKeyRequest.passphrase ? "[PASSPHRASE CONTENT]" : "undefined"
      });
      
      await SshKeysService.createSshKey(sshKeyRequest);
      form.reset();
      onSuccess();
    } catch (error: any) {
      console.error("Failed to create SSH key:", error);
      setError(error?.message || "Failed to create SSH key. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New SSH Key</DialogTitle>
          <DialogDescription>
            Add a new SSH key to your account. You can use this key to access multiple servers.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SSH Key Name</FormLabel>
                  <FormControl>
                    <Input placeholder="id_ed25519" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="keyType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SSH Key Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select SSH key type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="rsa">RSA</SelectItem>
                      <SelectItem value="ed25519">Ed25519</SelectItem>
                      <SelectItem value="ecdsa">ECDSA</SelectItem>
                      <SelectItem value="dsa">DSA</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="privateKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SSH Private Key</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ''}
                      placeholder="Paste private key or upload file"
                      className="mb-2"
                    />
                  </FormControl>
                  <Input
                    type="file"
                    accept="*"
                    name="privateKey"
                    onChange={handleFileChange}
                    className="hidden"
                    id="privateKeyFile"
                  />
                  <label htmlFor="privateKeyFile" className="text-sm font-medium text-blue-600 cursor-pointer">Choose File</label>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="passphrase"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SSH Passphrase (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      {...field}
                      value={field.value || ''}
                      placeholder="Enter passphrase if your private key is encrypted"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="publicKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SSH Public Key</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ''}
                      placeholder="Paste public key or upload file"
                      className="mb-2"
                    />
                  </FormControl>
                  <Input
                    type="file"
                    accept=".pub,.txt"
                    name="publicKey"
                    onChange={handleFileChange}
                    className="hidden"
                    id="publicKeyFile"
                  />
                  <label htmlFor="publicKeyFile" className="text-sm font-medium text-blue-600 cursor-pointer">Choose File</label>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="A brief description of this key's purpose" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {error && (
              <div className="text-red-600 text-sm p-3 bg-red-50 rounded-md border border-red-200">
                {error}
              </div>
            )}
            
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Key"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 