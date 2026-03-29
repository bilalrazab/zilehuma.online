import {
  Home, Users, Calendar, FileText, MessageSquare, BookOpen, BarChart3,
  Shield, Settings, Smile, History
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";

const doctorMenu = [
  { title: "Overview", url: "/dashboard", icon: Home },
  { title: "Clients", url: "/dashboard/clients", icon: Users },
  { title: "Appointments", url: "/dashboard/appointments", icon: Calendar },
  { title: "Sessions", url: "/dashboard/sessions", icon: FileText },
  { title: "Messages", url: "/dashboard/messages", icon: MessageSquare },
  { title: "Resources", url: "/dashboard/resources", icon: BookOpen },
  { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3 },
  { title: "Audit Log", url: "/dashboard/audit-log", icon: Shield },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

const clientMenu = [
  { title: "Overview", url: "/dashboard", icon: Home },
  { title: "Appointments", url: "/dashboard/appointments", icon: Calendar },
  { title: "Treatment Plans", url: "/dashboard/treatment-plans", icon: FileText },
  { title: "Messages", url: "/dashboard/messages", icon: MessageSquare },
  { title: "Resources", url: "/dashboard/resources", icon: BookOpen },
  { title: "Session History", url: "/dashboard/sessions", icon: History },
  { title: "Mood Tracker", url: "/dashboard/mood", icon: Smile },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

const DashboardSidebar = () => {
  const { role } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const menu = role === "client" ? clientMenu : doctorMenu;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        {!collapsed && (
          <a href="/" className="font-heading text-lg font-bold text-foreground">
            Zil-e-Huma
          </a>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menu.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="hover:bg-muted/50"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
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

export default DashboardSidebar;
