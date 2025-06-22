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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SecretsService } from "@/lib/api/services/SecretsService";
import { ExternalApplicationsService } from "@/lib/api/services/ExternalApplicationsService";
import { HostServersService } from "@/lib/api/services/HostServersService";
import { SshKeyHostMappingsService } from "@/lib/api/services/SshKeyHostMappingsService";
import { SshKeysService } from "@/lib/api/services/SshKeysService";
import type { CreateHostServerRequest } from "@/lib/api/models/CreateHostServerRequest";
import type { CreateSshKeyHostMappingRequestWithoutUserID } from "@/lib/api/models/CreateSshKeyHostMappingRequestWithoutUserID";
import type { CreateSshKeyRequest } from "@/lib/api/models/CreateSshKeyRequest";

const nodeFormSchema = z.object({
    hostname: z.string().min(1, "Hostname is required"),
    ipAddress: z.string().min(1, "IP Address is required"),
    username: z.string().min(1, "Username is required"),
    publicSshKeyname: z.string().min(1, "SSH Key name is required"),
    keyType: z.string().min(1, "SSH Key type is required"),
    isContainerHost: z.boolean(),
    isVirtualMachine: z.boolean(),
    isVmHost: z.boolean(),
    idDbHost: z.boolean(),
    sshPrivateKey: z.string().min(1, "Private SSH key is required"),
    sshPublicKey: z.string().min(1, "Public SSH key is required"),
    sudoPassword: z.string().optional(),
  });

export type NodeFormValues = z.infer<typeof nodeFormSchema> & {
  ssh_key_id?: string;
  sudo_password_token_id?: string;
};

interface AddNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddNodeDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddNodeDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const resolver: Resolver<NodeFormValues> = zodResolver(nodeFormSchema);

  const form = useForm<NodeFormValues & { sshPrivateKey?: string; sshPublicKey?: string; sudoPassword?: string; keyType?: string }>({
    resolver,
    defaultValues: {
      hostname: "",
      ipAddress: "",
      username: "",
      publicSshKeyname: "",
      keyType: "rsa",
      isContainerHost: false,
      isVirtualMachine: false,
      isVmHost: false,
      idDbHost: false,
      sshPrivateKey: "",
      sshPublicKey: "",
      sudoPassword: "",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        form.setValue(name as any, event.target?.result as string);
      };
      reader.readAsText(files[0]);
    }
  };

  const handleSubmit: SubmitHandler<NodeFormValues & { sshPrivateKey?: string; sshPublicKey?: string; sudoPassword?: string; keyType?: string }> = async (data) => {
    try {
      setIsSubmitting(true);
      let sshKeyId: string | undefined = undefined;
      let sudoPasswordId: string | undefined = undefined;
      

      // Create SSH key first
      if (data.sshPrivateKey && data.sshPublicKey) {
        const sshKeyRequest: CreateSshKeyRequest = {
          name: data.publicSshKeyname,
          privateKey: data.sshPrivateKey,
          publicKey: data.sshPublicKey,
          keyType: data.keyType || "ed25519",
          description: `SSH key for ${data.hostname}`,
        };
        
        const sshKeyResponse = await SshKeysService.createSshKey(sshKeyRequest);
        sshKeyId = sshKeyResponse.sshKeyId;
      }

      if (data.sudoPassword) {
        // Get or create the external application ID for "sudo_pwd"
        let sudoAppId: string;
        try {
          const sudoAppResponse = await ExternalApplicationsService.getExternalApplicationIdByName("sudo_pwd");
          const responseId = sudoAppResponse.id;
          
          if (!responseId) {
            throw new Error("sudo_pwd application not found");
          }
          sudoAppId = responseId;
        } catch (error) {
          // Application doesn't exist, create it
          const createAppResponse = await ExternalApplicationsService.createExternalApplication({
            name: "sudo_pwd",
            appDescription: "Sudo passwords for managed nodes"
          });
          const responseId = createAppResponse.id;
          
          if (!responseId) {
            throw new Error("Failed to create sudo_pwd application");
          }
          sudoAppId = responseId;
        }

        const secretRes = await SecretsService.createUserSecret({ 
          secret: data.sudoPassword,
          application_id: sudoAppId
        });
        sudoPasswordId = secretRes.id || secretRes.ID || secretRes.secret_id;
      }

      const createRequest: CreateHostServerRequest = {
        hostname: data.hostname,
        ip_address: data.ipAddress,
        is_container_host: data.isContainerHost,
        is_virtual_machine: data.isVirtualMachine,
        is_vm_host: data.isVmHost,
        is_db_host: data.idDbHost,
        username: data.username,
        ssh_key_id: sshKeyId,
        sudo_password_token_id: sudoPasswordId,
      };

      const hostServerResponse = await HostServersService.createHostServer(createRequest);
      const hostServerId = hostServerResponse.id;

      if (sshKeyId && hostServerId && data.username) {
        const mappingRequest: CreateSshKeyHostMappingRequestWithoutUserID = {
          hostServerId: hostServerId,
          hostserverUsername: data.username,
          sshKeyId: sshKeyId,
          sudoPasswordTokenId: sudoPasswordId,
        };
        await SshKeyHostMappingsService.createSshKeyHostMapping(mappingRequest);
      }

      form.reset();
      onSuccess();
    } finally {
      setIsSubmitting(false);
    }
  };

  const control: Control<NodeFormValues> = form.control;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add New Node</DialogTitle>
          <DialogDescription>
            Add a new server to your managed nodes inventory.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 overflow-y-auto pr-2">
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
            <FormField
              control={control}
              name="keyType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SSH Key Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      {isSubmitting ? (
                        <Skeleton className="h-10 w-full" />
                      ) : (
                        <SelectTrigger>
                          <SelectValue placeholder="Select SSH key type" />
                        </SelectTrigger>
                      )}
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
            <div>
              <FormLabel>SSH Private Key</FormLabel>
              <FormField
                control={control}
                name="sshPrivateKey"
                render={({ field }) => (
                  <Input
                    name="sshPrivateKey"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Paste private key or upload file"
                    className="mb-2"
                  />
                )}
              />
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept=".pem,.key,.txt"
                  name="sshPrivateKey"
                  onChange={handleFileChange}
                  className="hidden"
                  id="sshPrivateKeyFile"
                />
                <label
                  htmlFor="sshPrivateKeyFile"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 cursor-pointer"
                >
                  Choose File
                </label>
                <span className="text-xs text-muted-foreground">or paste above</span>
              </div>
            </div>
            <div>
              <FormLabel>SSH Public Key</FormLabel>
              <FormField
                control={control}
                name="sshPublicKey"
                render={({ field }) => (
                  <Input
                    name="sshPublicKey"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Paste public key or upload file"
                    className="mb-2"
                  />
                )}
              />
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept=".pub,.txt"
                  name="sshPublicKey"
                  onChange={handleFileChange}
                  className="hidden"
                  id="sshPublicKeyFile"
                />
                <label
                  htmlFor="sshPublicKeyFile"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 cursor-pointer"
                >
                  Choose File
                </label>
                <span className="text-xs text-muted-foreground">or paste above</span>
              </div>
            </div>
            <div>
              <FormLabel>Sudo Password</FormLabel>
              <FormField
                control={control}
                name="sudoPassword"
                render={({ field }) => (
                  <Input
                    name="sudoPassword"
                    type="password"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Enter sudo password or upload file"
                    className="mb-2"
                  />
                )}
              />
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept=".txt"
                  name="sudoPassword"
                  onChange={handleFileChange}
                  className="hidden"
                  id="sudoPasswordFile"
                />
                <label
                  htmlFor="sudoPasswordFile"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 cursor-pointer"
                >
                  Choose File
                </label>
                <span className="text-xs text-muted-foreground">or paste above</span>
              </div>
            </div>
            <DialogFooter className="sticky bottom-0 bg-background pt-4">
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