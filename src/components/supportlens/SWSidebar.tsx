import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Upload,
  Search,
  NotebookPen,
  BookOpen,
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
  { title: "Notes (SOAP)", url: "/sw/notes", icon: NotebookPen },
  { title: "Library", url: "/sw/library", icon: BookOpen },
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
                        isActive 
                          ? "bg-gradient-to-r from-primary/10 to-transparent border-l-2 border-primary font-medium" 
                          : "hover:bg-sidebar-accent/50 transition-colors"
                      }
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.title}</span>
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
