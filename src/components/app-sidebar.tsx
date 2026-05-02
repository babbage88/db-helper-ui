"use client";

import * as React from "react";
import {
  BookOpen,
  Bot,
  Server,
  Command,
  Split,
  GalleryVerticalEnd,
  Settings2,
  SquareTerminal,
  Container,
  Database,
  FolderSync,
  Lock,
  HardDrive,
  Users,
  Shield,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { isProxmoxHostNodeTypeNames } from "@/app/nodes/manage/proxmox-utils";
import { SshKeyHostMappingsService } from "@/lib/api/services/SshKeyHostMappingsService";
import { HostServersService } from "@/lib/api/services/HostServersService";
import { useAuth } from "@/lib/auth-context";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user: sessionUser } = useAuth();
  const [hasAssignedProxmoxNode, setHasAssignedProxmoxNode] = React.useState(false);

  const user = React.useMemo(() => ({
    name: sessionUser?.userName || "Anonymous",
    email: sessionUser?.email || "no-email@example.com",
    avatar: "",
    userId: sessionUser?.user_id || "",
  }), [sessionUser]);

  React.useEffect(() => {
    let isMounted = true;

    async function loadAssignedProxmoxAccess() {
      if (!sessionUser?.user_id) {
        if (isMounted) {
          setHasAssignedProxmoxNode(false);
        }
        return;
      }

      try {
        const [allServers, userMappings] = await Promise.all([
          HostServersService.getAllHostServers(),
          SshKeyHostMappingsService.getSshKeyHostMappingsByUserId(sessionUser.user_id),
        ]);

        const assignedHostIds = new Set(
          userMappings.map((mapping) => mapping.hostServerId).filter(Boolean)
        );

        const hasProxmoxNode = allServers.some((server) => {
          if (!server.id || !assignedHostIds.has(server.id)) {
            return false;
          }

          const platformTypeNames = Array.isArray(server.platform_types)
            ? server.platform_types.map((type) => type.name || "")
            : [];
          const hostServerTypeNames = Array.isArray(server.host_server_types)
            ? server.host_server_types.map((type) => type.name || "")
            : [];

          return isProxmoxHostNodeTypeNames(platformTypeNames, hostServerTypeNames);
        });

        if (isMounted) {
          setHasAssignedProxmoxNode(hasProxmoxNode);
        }
      } catch (error) {
        console.error("Failed to determine Proxmox Explorer visibility:", error);
        if (isMounted) {
          setHasAssignedProxmoxNode(false);
        }
      }
    }

    loadAssignedProxmoxAccess();

    return () => {
      isMounted = false;
    };
  }, [sessionUser?.user_id]);

  const nodeItems = React.useMemo(() => {
    const items = [
      {
        title: "Manage",
        url: "/nodes/manage",
      },
    ];

    if (hasAssignedProxmoxNode) {
      items.push({
        title: "Proxmox Explorer",
        url: "/nodes/proxmox",
      });
    }

    return items;
  }, [hasAssignedProxmoxNode]);

  const data = {
    user,
    teams: [
      {
        name: "Trahan",
        logo: GalleryVerticalEnd,
        plan: "Enterprise",
      },
      {
        name: "infractl",
        logo: Split,
        plan: "Control Plane",
      },
      {
        name: "Evil Corp.",
        logo: Command,
        plan: "Free",
      },
    ],
    navMain: [
      {
        title: "Database",
        url: "/dbusersetup",
        icon: Database,
        isActive: true,
        items: [
          {
            title: "Database URL Builder",
            url: "/pgurlbuilder",
          },
          {
            title: "Create New DB",
            url: "/dbusersetup",
            icon: Bot,
          },
        ],
      },
      {
        title: "Nodes",
        url: "/nodes/manage",
        icon: Server,
        items: nodeItems,
      },
      {
        title: "Users",
        url: "/users/manage",
        icon: Users,
        items: [
          {
            title: "Manage",
            url: "/users/manage",
          },
        ],
      },
      {
        title: "Roles & Permissions",
        url: "/roles/manage",
        icon: Shield,
        items: [
          {
            title: "Manage Roles",
            url: "/roles/manage",
          },
        ],
      },
      {
        title: "Certificates",
        url: "/cert-renew",
        icon: Lock,
        items: [
          {
            title: "Create/Renew Certificate",
            url: "/cert-renew",
          },
          {
            title: "Deploy",
            url: "#",
            icon: SquareTerminal,
            items: [
              {
                title: "Kubernetes",
                url: "/certs/kube",
                icon: Container,
              },
              {
                title: "VM",
                url: "/certs/vm",
                icon: Server,
              },
            ],
          },
        ],
      },
      {
        title: "Object Storage",
        url: "/storage/manage",
        icon: HardDrive,
        items: [
          {
            title: "Manage Buckets",
            url: "/storage/manage",
          },
        ],
      },
      {
        title: "Documentation",
        url: "#",
        icon: BookOpen,
        items: [
          {
            title: "Introduction",
            url: "/docs",
          },
          {
            title: "Get Started",
            url: "/docs",
          },
        ],
      },
      {
        title: "Settings",
        url: "#",
        icon: Settings2,
        items: [
          {
            title: "General",
            url: "#",
          },
          {
            title: "Register Resources",
            url: "#",
          },
        ],
      },
    ],
    projects: [
      {
        name: "SmbPlusPlus",
        url: "#",
        icon: FolderSync,
      },
      {
        name: "FailBot",
        url: "#",
        icon: Split,
      },
    ],
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
         <SidebarTrigger />
        <TeamSwitcher teams={data.teams} />{" "}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
