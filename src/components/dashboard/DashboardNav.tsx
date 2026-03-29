import { Bell, LogOut, Settings, ExternalLink } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const db = supabase as any;

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/clients': 'Clients',
  '/dashboard/tasks': 'Tasks',
  '/dashboard/calendar': 'Calendar',
  '/dashboard/resources': 'Resources',
  '/dashboard/messages': 'Messages',
  '/dashboard/settings': 'Settings',
  '/dashboard/sessions': 'Sessions',
  '/dashboard/progress': 'Progress',
};

const DashboardNav = () => {
  const { profile, signOut, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => { loadNotifications(); }, []);

  const loadNotifications = async () => {
    const { data, count } = await db.from('notifications').select('*', { count: 'exact' })
      .eq('read', false).order('created_at', { ascending: false }).limit(5);
    setNotifications(data || []);
    setUnreadCount(count || 0);
  };

  const markAllRead = async () => {
    await db.from('notifications').update({ read: true }).eq('read', false);
    setUnreadCount(0);
    setNotifications([]);
  };

  const handleSignOut = async () => { await signOut(); navigate("/login"); };

  const currentTitle = Object.entries(routeTitles).find(([path]) =>
    location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path))
  )?.[1] || 'Dashboard';

  const roleLabel = role === 'super_admin' ? 'Admin' : role === 'doctor' ? 'Doctor' : 'Client';

  return (
    <header className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center px-4 gap-4 sticky top-0 z-10">
      <SidebarTrigger />
      <h2 className="font-semibold text-sm hidden sm:block">{currentTitle}</h2>
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="font-semibold text-sm">Notifications</span>
              {unreadCount > 0 && <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={markAllRead}>Mark all read</Button>}
            </div>
            <DropdownMenuSeparator />
            {notifications.length > 0 ? notifications.map(n => (
              <DropdownMenuItem key={n.id} className="flex-col items-start gap-0.5 py-2.5">
                <span className="font-medium text-sm">{n.title}</span>
                {n.message && <span className="text-xs text-muted-foreground line-clamp-1">{n.message}</span>}
              </DropdownMenuItem>
            )) : (
              <div className="py-6 text-center text-sm text-muted-foreground">No new notifications</div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 h-9">
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                {(profile?.full_name || 'U').charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline text-sm font-medium">{profile?.full_name?.split(' ')[0] || 'User'}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-3 py-2">
              <p className="font-semibold text-sm">{profile?.full_name || 'User'}</p>
              <p className="text-xs text-muted-foreground">{profile?.email}</p>
              <Badge variant="secondary" className="mt-1 text-xs">{roleLabel}</Badge>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}><Settings className="h-4 w-4 mr-2" /> Settings</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/")}><ExternalLink className="h-4 w-4 mr-2" /> View Website</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive"><LogOut className="h-4 w-4 mr-2" /> Sign Out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default DashboardNav;
