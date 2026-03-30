import {
  Home, Users, CheckSquare, Calendar, BookOpen, MessageSquare,
  Settings, BarChart3, Clock, PenLine
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";

const doctorMenu = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Clients", url: "/dashboard/clients", icon: Users },
  { title: "Tasks", url: "/dashboard/tasks", icon: CheckSquare },
  { title: "Calendar", url: "/dashboard/calendar", icon: Calendar },
  { title: "Resources", url: "/dashboard/resources", icon: BookOpen },
  { title: "Messages", url: "/dashboard/messages", icon: MessageSquare },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

const clientMenu = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Sessions", url: "/dashboard/sessions", icon: Clock },
  { title: "Calendar", url: "/dashboard/calendar", icon: Calendar },
  { title: "Tasks", url: "/dashboard/tasks", icon: CheckSquare },
  { title: "Messages", url: "/dashboard/messages", icon: MessageSquare },
  { title: "Progress", url: "/dashboard/progress", icon: BarChart3 },
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
