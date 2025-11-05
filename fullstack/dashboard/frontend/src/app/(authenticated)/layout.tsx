"use client"

import { AuthGuard } from "@/components/auth-guard"
import { GlobalLoadingSpinner } from "@/components/global-loading-spinner"
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { LayoutDashboard, Users, CheckSquare, Folder, LogOut } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { logout } from "@/lib/auth"
import { Separator } from "@/components/ui/separator"

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/crm", label: "CRM", icon: Users },
    { href: "/tasks", label: "Tasks", icon: CheckSquare },
    { href: "/projects", label: "Projects", icon: Folder },
  ]

  return (
    <AuthGuard>
      <GlobalLoadingSpinner />
      <SidebarProvider>
          <Sidebar>
            <SidebarHeader className="px-4 py-4">
              <div className="text-lg font-semibold">Dashboard</div>
            </SidebarHeader>
            <SidebarContent className="px-2">
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      onClick={() => router.push(item.href)}
                    >
                      <button className="w-full">
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
              <Separator className="my-4" />
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={handleLogout}>
                    <LogOut className="size-4" />
                    <span>Logout</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
          </Sidebar>
          <SidebarInset className="flex flex-col h-screen w-full overflow-hidden">
            <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-6">
              <SidebarTrigger />
            </header>
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
    </AuthGuard>
  )
}
