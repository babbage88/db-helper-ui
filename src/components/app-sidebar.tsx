"use client"

import * as React from "react"
import {
  AudioWaveform,
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
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = React.useState({
    name: "",
    email: "",
    avatar: "",
    userId: "",
  })

  React.useEffect(() => {
    const name = localStorage.getItem("username") || "Anonymous"
    const email = localStorage.getItem("email") || "no-email@example.com"
    const avatar = localStorage.getItem("avatar") || ""
    const userId = localStorage.getItem("userId") || ""
    setUser({ name, email, avatar, userId })
  }, [])

  const data = {
    user,
    teams: [
      {
        name: "Trahan",
        logo: GalleryVerticalEnd,
        plan: "Enterprise",
      },
      {
        name: "DbBob",
        logo: AudioWaveform,
        plan: "Startup",
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
        url: "#",
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
            icon: Bot
          },
        ],
      },
      {
        title: "Certificates",
        url: "#",
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
              }
            ],
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
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
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
  )
}
