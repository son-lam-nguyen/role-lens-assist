import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Upload,
  Users,
  Search,
  Calendar,
  NotebookPen,
  MessageSquare,
  BookOpen,
  AudioLines,
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
  { title: "Overview", url: "/sw", icon: LayoutDashboard, color: "text-primary" },
  { title: "Upload & Analyze", url: "/sw/upload", icon: Upload, color: "text-primary" },
  { title: "Client List", url: "/sw/clients", icon: Users, color: "text-blue-600" },
  { title: "Similar Cases", url: "/sw/cases", icon: Search, color: "text-accent" },
  { title: "Calendar", url: "/sw/calendar", icon: Calendar, color: "text-purple-600" },
  { title: "Notes (SOAP)", url: "/sw/notes", icon: NotebookPen, color: "text-orange-600" },
  { title: "Messages", url: "/sw/messages", icon: MessageSquare, color: "text-pink-600" },
  { title: "Library", url: "/sw/library", icon: BookOpen, color: "text-indigo-600" },
  { title: "Audio Recorded", url: "/sw/recordings", icon: AudioLines, color: "text-teal-600" },
  { title: "Settings", url: "/sw/settings", icon: SettingsIcon, color: "text-muted-foreground" },
];

export const SWSidebar = () => {
  return (
    <Sidebar className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto z-40 bg-background border-r">
      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Support Worker
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/sw"}
                      className={({ isActive }) =>
                        isActive 
                          ? "bg-gradient-to-r from-primary/15 to-primary/5 border-l-4 border-primary font-semibold text-primary shadow-sm" 
                          : "hover:bg-muted/50 hover:border-l-4 hover:border-l-muted-foreground/20 transition-all"
                      }
                    >
                      <item.icon className={`w-5 h-5 ${item.color}`} />
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
