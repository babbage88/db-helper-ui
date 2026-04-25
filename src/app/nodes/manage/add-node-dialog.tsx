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
import type { SshKeyListItem } from "@/lib/api/models/SshKeyListItem";
import { AddSshKeyDialog } from "@/components/db-helper/add-ssh-key-dialog";
import type { HostServerType } from "@/lib/api/models/HostServerType";
import type { PlatformType } from "@/lib/api/models/PlatformType";
import ReactSelect from 'react-select';
import type { MultiValue } from 'react-select';
import { useAuth } from "@/lib/auth-context";

const nodeFormSchema = z.object({
  hostname: z.string().min(1, "Hostname is required"),
  ipAddress: z.string().optional(),
  username: z.string().min(1, "Username is required"),
  sudoPassword: z.string().optional(),
  selectedSshKeyId: z.string().min(1, "Please select an SSH key"),
  hostServerTypeIds: z.array(z.string()).min(1, "Select at least one host server type"),
  platformTypeIds: z.array(z.string()).min(1, "Select at least one platform type"),
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
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [availableSshKeys, setAvailableSshKeys] = React.useState<SshKeyListItem[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = React.useState(false);
  const [showAddSshKeyDialog, setShowAddSshKeyDialog] = React.useState(false);
  const [hostServerTypes, setHostServerTypes] = React.useState<HostServerType[]>([]);
  const [platformTypes, setPlatformTypes] = React.useState<PlatformType[]>([]);
  const resolver: Resolver<NodeFormValues> = zodResolver(nodeFormSchema);

  const form = useForm<NodeFormValues>({
    resolver,
    defaultValues: {
      hostname: "",
      ipAddress: "",
      username: "",
      sudoPassword: "",
      selectedSshKeyId: "",
      hostServerTypeIds: [],
      platformTypeIds: [],
    },
  });

  // Fetch SSH keys
  const fetchKeys = React.useCallback(async () => {
    setIsLoadingKeys(true);
    try {
      if (!user?.user_id) {
        console.error("User ID not found. Cannot fetch SSH keys.");
        setAvailableSshKeys([]);
        return;
      }
      const keys = await SshKeysService.getSshKeysByUserId(user.user_id);
      setAvailableSshKeys(keys);
    } catch (error) {
      console.error("Failed to fetch SSH keys:", error);
    } finally {
      setIsLoadingKeys(false);
    }
  }, [user?.user_id]);

  // Fetch host server types and platform types
  const fetchTypes = React.useCallback(async () => {
    try {
      const [hostTypes, platTypes] = await Promise.all([
        HostServersService.getAllHostServerTypes(),
        HostServersService.getAllPlatformTypes(),
      ]);
      setHostServerTypes(hostTypes);
      setPlatformTypes(platTypes);
    } catch (error) {
      console.error("Failed to fetch types:", error);
      setHostServerTypes([]);
      setPlatformTypes([]);
    }
  }, []);

  React.useEffect(() => {
    if (open) {
      fetchKeys();
      fetchTypes();
    }
  }, [open, fetchKeys, fetchTypes]);

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

      if (data.sudoPassword) {
        let sudoAppId: string | undefined;
        try {
          const sudoAppResponse = await ExternalApplicationsService.getExternalApplicationIdByName("sudo_pwd");
          sudoAppId = sudoAppResponse.id;
        } catch (error) {
          console.log("sudo_pwd application not found, creating it.");
        }
        if (!sudoAppId) {
          const createAppResponse = await ExternalApplicationsService.createExternalApplication({
            name: "sudo_pwd",
            appDescription: "Sudo passwords for managed nodes"
          });
          sudoAppId = createAppResponse.id;
        }
        if (!sudoAppId) {
          throw new Error("Failed to get or create sudo_pwd application");
        }
        const secretRes = await SecretsService.createUserSecret({ 
          secret: data.sudoPassword,
          application_id: sudoAppId
        });
        sudoPasswordId = secretRes.id;
      }

      const allServers = await HostServersService.getAllHostServers();
      const existingHost = allServers.find(server => server.hostname === data.hostname);
      let hostServerId: string | undefined;
      if (existingHost) {
        hostServerId = existingHost.id;
      } else {
        const createRequest: CreateHostServerRequest = {
          hostname: data.hostname,
          host_server_type_ids: data.hostServerTypeIds,
          platform_type_ids: data.platformTypeIds,
          username: data.username,
          ssh_key_id: sshKeyId,
          sudo_password_token_id: sudoPasswordId,
        };
        if (data.ipAddress?.trim()) {
          createRequest.ip_address = data.ipAddress.trim();
        }
        const hostServerResponse = await HostServersService.createHostServer(createRequest);
        hostServerId = hostServerResponse.id;
      }
      if (hostServerId) {
        // Create host server type mappings
        await Promise.all(
          data.hostServerTypeIds.map(typeId =>
            HostServersService.createHostServerTypeMapping({ hostServerId, hostServerTypeId: typeId })
          )
        );
        // Create platform type mappings (cross-product)
        await Promise.all(
          data.hostServerTypeIds.flatMap(hostTypeId =>
            data.platformTypeIds.map(platformTypeId =>
              HostServersService.createPlatformTypeMapping({ hostServerId, hostServerTypeId: hostTypeId, platformTypeId })
            )
          )
        );
      }
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
    <>
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
                    <Input placeholder="Optional" {...field} />
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
            {/* Host Server Types Tag Input */}
            <FormField
              control={control}
              name="hostServerTypeIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Host Server Types</FormLabel>
                  <ReactSelect
                    isMulti
                    options={hostServerTypes.map(type => ({ value: type.id, label: type.name }))}
                    value={hostServerTypes
                      .filter(type => field.value.includes(type.id))
                      .map(type => ({ value: type.id, label: type.name })) as any}
                    onChange={(selected: MultiValue<{ value: string; label: string }>) =>
                      field.onChange(selected.map(option => option.value))
                    }
                    classNamePrefix="react-select"
                    placeholder="Select host server types..."
                    theme={theme => ({
                      ...theme,
                      borderRadius: 6,
                      colors: {
                        ...theme.colors,
                        primary25: '#22223b',
                        primary: '#4f46e5',
                        neutral0: '#18181b',
                        neutral80: '#f4f4f5',
                        neutral20: '#27272a',
                        neutral30: '#4f46e5',
                      },
                    })}
                    styles={{
                      input: (base) => ({
                        ...base,
                        color: '#f4f4f5',
                        fontFamily: 'inherit',
                      }),
                      singleValue: (base) => ({
                        ...base,
                        color: '#f4f4f5',
                        fontFamily: 'inherit',
                      }),
                      multiValue: (base) => ({
                        ...base,
                        backgroundColor: '#27272a',
                        color: '#f4f4f5',
                        fontFamily: 'inherit',
                      }),
                      menu: (base) => ({
                        ...base,
                        backgroundColor: '#18181b',
                        color: '#f4f4f5',
                        fontFamily: 'inherit',
                      }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isFocused ? '#22223b' : '#18181b',
                        color: '#f4f4f5',
                        fontFamily: 'inherit',
                      }),
                    }}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Platform Types Tag Input */}
            <FormField
              control={control}
              name="platformTypeIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Platform Types</FormLabel>
                  <ReactSelect
                    isMulti
                    options={platformTypes.map(type => ({ value: type.id, label: type.name }))}
                    value={platformTypes
                      .filter(type => field.value.includes(type.id))
                      .map(type => ({ value: type.id, label: type.name })) as any}
                    onChange={(selected: MultiValue<{ value: string; label: string }>) =>
                      field.onChange(selected.map(option => option.value))
                    }
                    classNamePrefix="react-select"
                    placeholder="Select platform types..."
                    theme={theme => ({
                      ...theme,
                      borderRadius: 6,
                      colors: {
                        ...theme.colors,
                        primary25: '#22223b',
                        primary: '#4f46e5',
                        neutral0: '#18181b',
                        neutral80: '#f4f4f5',
                        neutral20: '#27272a',
                        neutral30: '#4f46e5',
                      },
                    })}
                    styles={{
                      input: (base) => ({
                        ...base,
                        color: '#f4f4f5',
                        fontFamily: 'inherit',
                      }),
                      singleValue: (base) => ({
                        ...base,
                        color: '#f4f4f5',
                        fontFamily: 'inherit',
                      }),
                      multiValue: (base) => ({
                        ...base,
                        backgroundColor: '#27272a',
                        color: '#f4f4f5',
                        fontFamily: 'inherit',
                      }),
                      menu: (base) => ({
                        ...base,
                        backgroundColor: '#18181b',
                        color: '#f4f4f5',
                        fontFamily: 'inherit',
                      }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isFocused ? '#22223b' : '#18181b',
                        color: '#f4f4f5',
                        fontFamily: 'inherit',
                      }),
                    }}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
    <AddSshKeyDialog
      open={showAddSshKeyDialog}
      onOpenChange={setShowAddSshKeyDialog}
      onSuccess={() => {
        setShowAddSshKeyDialog(false);
        fetchKeys();
      }}
    />
    </>
  );
} 
