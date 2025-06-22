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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SecretsService } from "@/lib/api/services/SecretsService";
import { ExternalApplicationsService } from "@/lib/api/services/ExternalApplicationsService";
import { HostServersService } from "@/lib/api/services/HostServersService";
import { SshKeyHostMappingsService } from "@/lib/api/services/SshKeyHostMappingsService";
import { SshKeysService } from "@/lib/api/services/SshKeysService";
import type { CreateHostServerRequest } from "@/lib/api/models/CreateHostServerRequest";
import type { CreateSshKeyHostMappingRequestWithoutUserID } from "@/lib/api/models/CreateSshKeyHostMappingRequestWithoutUserID";
import type { CreateSshKeyRequest } from "@/lib/api/models/CreateSshKeyRequest";
import type { SshKeyListItem } from "@/lib/api/models/SshKeyListItem";

const nodeFormSchema = z.object({
    hostname: z.string().min(1, "Hostname is required"),
    ipAddress: z.string().min(1, "IP Address is required"),
    username: z.string().min(1, "Username is required"),
    sudoPassword: z.string().optional(),
    isContainerHost: z.boolean(),
    isVirtualMachine: z.boolean(),
    isVmHost: z.boolean(),
    idDbHost: z.boolean(),
    keyCreationMode: z.enum(["new", "existing"]),
    publicSshKeyname: z.string().optional(),
    keyType: z.string().optional(),
    sshPrivateKey: z.string().optional(),
    sshPublicKey: z.string().optional(),
    selectedSshKeyId: z.string().optional(),
  }).superRefine((data, ctx) => {
    if (data.keyCreationMode === "new") {
      if (!data.publicSshKeyname) {
        ctx.addIssue({
          code: "custom",
          path: ["publicSshKeyname"],
          message: "SSH Key name is required",
        });
      }
      if (!data.keyType) {
        ctx.addIssue({
          code: "custom",
          path: ["keyType"],
          message: "SSH Key type is required",
        });
      }
      if (!data.sshPrivateKey) {
        ctx.addIssue({
          code: "custom",
          path: ["sshPrivateKey"],
          message: "Private SSH key is required",
        });
      }
      if (!data.sshPublicKey) {
        ctx.addIssue({
          code: "custom",
          path: ["sshPublicKey"],
          message: "Public SSH key is required",
        });
      }
    } else if (data.keyCreationMode === "existing") {
      if (!data.selectedSshKeyId) {
        ctx.addIssue({
          code: "custom",
          path: ["selectedSshKeyId"],
          message: "Please select an SSH key",
        });
      }
    }
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
  const [availableSshKeys, setAvailableSshKeys] = React.useState<SshKeyListItem[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = React.useState(false);
  const resolver: Resolver<NodeFormValues> = zodResolver(nodeFormSchema);

  const form = useForm<NodeFormValues>({
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
      keyCreationMode: "new",
    },
  });

  React.useEffect(() => {
    if (open) {
      const fetchKeys = async () => {
        setIsLoadingKeys(true);
        try {
          const userId = localStorage.getItem("userId");
          if (!userId) {
            console.error("User ID not found. Cannot fetch SSH keys.");
            // Fallback to new key creation mode
            form.setValue("keyCreationMode", "new");
            setAvailableSshKeys([]);
            return;
          }

          const keys = await SshKeysService.getSshKeysByUserId(userId);
          setAvailableSshKeys(keys);
          if (keys.length > 0) {
            form.setValue("keyCreationMode", "existing");
          }
        } catch (error) {
          console.error("Failed to fetch SSH keys:", error);
          // Fallback to new key creation if fetching fails
          form.setValue("keyCreationMode", "new");
        } finally {
          setIsLoadingKeys(false);
        }
      };
      fetchKeys();
    }
  }, [open, form]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        form.setValue(name as keyof NodeFormValues, event.target?.result as string);
      };
      reader.readAsText(files[0]);
    }
  };

  const handleSubmit: SubmitHandler<NodeFormValues> = async (data) => {
    try {
      setIsSubmitting(true);
      let sshKeyId: string | undefined = data.selectedSshKeyId;
      let sudoPasswordId: string | undefined = undefined;

      if (data.keyCreationMode === "new") {
        if (data.publicSshKeyname && data.sshPrivateKey && data.sshPublicKey) {
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
      }

      if (data.sudoPassword) {
        let sudoAppId: string;
        try {
          const sudoAppResponse = await ExternalApplicationsService.getExternalApplicationIdByName("sudo_pwd");
          if (!sudoAppResponse.id) {
            throw new Error("sudo_pwd application not found");
          }
          sudoAppId = sudoAppResponse.id;
        } catch (error) {
          const createAppResponse = await ExternalApplicationsService.createExternalApplication({
            name: "sudo_pwd",
            appDescription: "Sudo passwords for managed nodes"
          });
          if (!createAppResponse.id) {
            throw new Error("Failed to create sudo_pwd application");
          }
          sudoAppId = createAppResponse.id;
        }

        const secretRes = await SecretsService.createUserSecret({ 
          secret: data.sudoPassword,
          application_id: sudoAppId
        });
        sudoPasswordId = secretRes.id;
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
  const keyCreationMode = form.watch("keyCreationMode");

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
                    <Input placeholder="server.example.com" {...field} />
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
                    <Input placeholder="192.168.1.1" {...field} />
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
                    <Input placeholder="root" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={control}
              name="keyCreationMode"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>SSH Key</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="new" />
                        </FormControl>
                        <FormLabel className="font-normal">Create New</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="existing" disabled={isLoadingKeys || availableSshKeys.length === 0} />
                        </FormControl>
                        <FormLabel className="font-normal">Use Existing</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {keyCreationMode === 'new' && (
              <>
                <FormField
                  control={control}
                  name="publicSshKeyname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SSH Key Name</FormLabel>
                      <FormControl>
                        <Input placeholder="id_rsa" {...field} />
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
                <div>
                  <FormLabel>SSH Private Key</FormLabel>
                  <FormField
                    control={control}
                    name="sshPrivateKey"
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={field.value || ''}
                        placeholder="Paste private key or upload file"
                        className="mb-2"
                      />
                    )}
                  />
                  <Input
                    type="file"
                    accept=".pem,.key,.txt"
                    name="sshPrivateKey"
                    onChange={handleFileChange}
                    className="hidden"
                    id="sshPrivateKeyFile"
                  />
                  <label htmlFor="sshPrivateKeyFile" className="text-sm font-medium text-blue-600 cursor-pointer">Choose File</label>
                </div>
                <div>
                  <FormLabel>SSH Public Key</FormLabel>
                  <FormField
                    control={control}
                    name="sshPublicKey"
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={field.value || ''}
                        placeholder="Paste public key or upload file"
                        className="mb-2"
                      />
                    )}
                  />
                  <Input
                    type="file"
                    accept=".pub,.txt"
                    name="sshPublicKey"
                    onChange={handleFileChange}
                    className="hidden"
                    id="sshPublicKeyFile"
                  />
                  <label htmlFor="sshPublicKeyFile" className="text-sm font-medium text-blue-600 cursor-pointer">Choose File</label>
                </div>
              </>
            )}

            {keyCreationMode === 'existing' && (
              <FormField
                control={control}
                name="selectedSshKeyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select SSH Key</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an existing SSH key" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingKeys ? (
                          <SelectItem value="loading" disabled>Loading keys...</SelectItem>
                        ) : (
                          availableSshKeys.map((key) => (
                            <SelectItem key={key.id} value={key.id!}>
                              {key.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={control}
                name="isContainerHost"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    <FormLabel>Container Host</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="isVirtualMachine"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    <FormLabel>Virtual Machine</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="isVmHost"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    <FormLabel>VM Host</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="idDbHost"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    <FormLabel>DB Host</FormLabel>
                  </FormItem>
                )}
              />
            </div>
            
            <div>
              <FormLabel>Sudo Password</FormLabel>
              <FormField
                control={control}
                name="sudoPassword"
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value || ''}
                    type="password"
                    placeholder="Enter sudo password or upload file"
                    className="mb-2"
                  />
                )}
              />
              <Input
                type="file"
                accept=".txt"
                name="sudoPassword"
                onChange={handleFileChange}
                className="hidden"
                id="sudoPasswordFile"
              />
              <label htmlFor="sudoPasswordFile" className="text-sm font-medium text-blue-600 cursor-pointer">Choose File</label>
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