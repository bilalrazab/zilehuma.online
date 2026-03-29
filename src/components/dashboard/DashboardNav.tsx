import { Bell, LogOut, Settings, ExternalLink, Moon, Sun } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  const { profile, signOut, role, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("theme");
      if (stored) return stored === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    if (user?.id) loadNotifications();
  }, [user?.id]);

  // Realtime notifications
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase.channel('nav-notifs')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, () => loadNotifications())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const loadNotifications = async () => {
    const { data, count } = await db.from('notifications').select('*', { count: 'exact' })
      .eq('user_id', user?.id).eq('read', false).order('created_at', { ascending: false }).limit(10);
    setNotifications(data || []);
    setUnreadCount(count || 0);
  };

  const markAllRead = async () => {
    await db.from('notifications').update({ read: true }).eq('user_id', user?.id).eq('read', false);
    setUnreadCount(0);
    setNotifications([]);
  };

  const markOneRead = async (id: string, link?: string) => {
    await db.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    setUnreadCount(prev => Math.max(0, prev - 1));
    if (link) navigate(link);
  };

  const handleSignOut = async () => { await signOut(); navigate("/login"); };

  const currentTitle = Object.entries(routeTitles).find(([path]) =>
    location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path))
  )?.[1] || 'Dashboard';

  const roleLabel = role === 'super_admin' ? 'Admin' : role === 'doctor' ? 'Doctor' : 'Client';
  const avatarUrl = profile?.avatar_url;
  const initials = (profile?.full_name || 'U').charAt(0).toUpperCase();

  return (
    <header className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center px-4 gap-4 sticky top-0 z-10">
      <SidebarTrigger />
      <h2 className="font-semibold text-sm hidden sm:block">{currentTitle}</h2>
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" onClick={() => setDark(!dark)} className="h-9 w-9">
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="font-semibold text-sm">Notifications</span>
              {unreadCount > 0 && <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={markAllRead}>Mark all read</Button>}
            </div>
            <DropdownMenuSeparator />
            {notifications.length > 0 ? notifications.map(n => (
              <DropdownMenuItem key={n.id} className="flex-col items-start gap-0.5 py-2.5 cursor-pointer"
                onClick={() => markOneRead(n.id, n.link)}>
                <div className="flex items-center gap-2 w-full">
                  <Badge variant={n.type === 'warning' ? 'destructive' : n.type === 'success' ? 'default' : 'secondary'} className="text-[9px] h-4 px-1.5">{n.type}</Badge>
                  <span className="font-medium text-sm flex-1 truncate">{n.title}</span>
                </div>
                {n.message && <span className="text-xs text-muted-foreground line-clamp-2 pl-0">{n.message}</span>}
                <span className="text-[10px] text-muted-foreground/60">{n.created_at ? new Date(n.created_at).toLocaleString() : ''}</span>
              </DropdownMenuItem>
            )) : (
              <div className="py-8 text-center">
                <Bell className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No new notifications</p>
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 h-9">
              <Avatar className="h-7 w-7">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={profile?.full_name} />}
                <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
              </Avatar>
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
