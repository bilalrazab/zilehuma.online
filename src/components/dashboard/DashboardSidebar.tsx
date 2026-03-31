import { useEffect, useState } from "react";
import {
  Home, Users, CheckSquare, Calendar, BookOpen, MessageSquare,
  Settings, BarChart3, Clock, PenLine
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";

const db = supabase as any;

const doctorMenu = [
  { title: "Dashboard", url: "/dashboard", icon: Home, key: "dashboard" },
  { title: "Clients", url: "/dashboard/clients", icon: Users, key: "clients" },
  { title: "Tasks", url: "/dashboard/tasks", icon: CheckSquare, key: "tasks" },
  { title: "Calendar", url: "/dashboard/calendar", icon: Calendar, key: "calendar" },
  { title: "Resources", url: "/dashboard/resources", icon: BookOpen, key: "resources" },
  { title: "Messages", url: "/dashboard/messages", icon: MessageSquare, key: "messages" },
  { title: "Settings", url: "/dashboard/settings", icon: Settings, key: "settings" },
];

const clientMenu = [
  { title: "Dashboard", url: "/dashboard", icon: Home, key: "dashboard" },
  { title: "Sessions", url: "/dashboard/sessions", icon: Clock, key: "sessions" },
  { title: "Calendar", url: "/dashboard/calendar", icon: Calendar, key: "calendar" },
  { title: "Tasks", url: "/dashboard/tasks", icon: CheckSquare, key: "tasks" },
  { title: "Messages", url: "/dashboard/messages", icon: MessageSquare, key: "messages" },
  { title: "Progress", url: "/dashboard/progress", icon: BarChart3, key: "progress" },
  { title: "Write Review", url: "/testimonial/new", icon: PenLine, key: "review" },
  { title: "Settings", url: "/dashboard/settings", icon: Settings, key: "settings" },
];

const DashboardSidebar = () => {
  const { role, user } = useAuth();
  const { state, setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();
  const collapsed = state === "collapsed";
  const menu = role === "client" ? clientMenu : doctorMenu;

  const [attention, setAttention] = useState<Record<string, number>>({});

  // Fetch attention counts
  useEffect(() => {
    if (!user?.id) return;
    const fetchAttention = async () => {
      const counts: Record<string, number> = {};
      try {
        // Unread messages
        const { count: msgCount } = await db
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("read", false)
          .neq("sender_id", user.id);
        if (msgCount) counts.messages = msgCount;

        // Overdue / pending tasks
        const today = new Date().toISOString().split("T")[0];
        if (role === "doctor" || role === "super_admin") {
          const { count: taskCount } = await db
            .from("tasks")
            .select("id", { count: "exact", head: true })
            .eq("status", "pending")
            .lt("due_date", today);
          if (taskCount) counts.tasks = taskCount;
        } else {
          // client: all pending tasks
          const { data: cr } = await db.from("clients").select("id").eq("user_id", user.id).single();
          if (cr) {
            const { count: taskCount } = await db
              .from("tasks")
              .select("id", { count: "exact", head: true })
              .eq("client_id", cr.id)
              .eq("status", "pending");
            if (taskCount) counts.tasks = taskCount;
          }
        }
      } catch { /* ignore */ }
      setAttention(counts);
    };
    fetchAttention();
    const interval = setInterval(fetchAttention, 30000);
    return () => clearInterval(interval);
  }, [user?.id, role]);

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

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
              {menu.map((item) => {
                const count = attention[item.key] || 0;
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/dashboard"}
                        className="hover:bg-muted/50"
                        activeClassName="bg-primary/10 text-primary font-medium"
                        onClick={handleNavClick}
                      >
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span className="flex-1">{item.title}</span>}
                        {count > 0 && (
                          <Badge
                            variant="destructive"
                            className="ml-auto h-5 min-w-[20px] px-1.5 text-[10px] font-bold rounded-full"
                          >
                            {count > 99 ? "99+" : count}
                          </Badge>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default DashboardSidebar;
