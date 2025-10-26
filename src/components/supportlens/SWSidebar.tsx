import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Upload,
  Search,
  FileText,
  Library,
  Settings as SettingsIcon
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Overview", url: "/sw", icon: LayoutDashboard },
  { title: "Upload & Analyze", url: "/sw/upload", icon: Upload },
  { title: "Similar Cases", url: "/sw/cases", icon: Search },
  { title: "Notes (SOAP)", url: "/sw/notes", icon: FileText },
  { title: "Library", url: "/sw/library", icon: Library },
  { title: "Settings", url: "/sw/settings", icon: SettingsIcon },
];

export const SWSidebar = () => {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Support Worker</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/sw"}
                      className={({ isActive }) =>
                        isActive ? "bg-sidebar-accent" : ""
                      }
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
