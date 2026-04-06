import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

type AppRole = "super_admin" | "doctor" | "client" | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole;
  roleLoaded: boolean;
  profile: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, fullName: string) => Promise<any>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole>(null);
  const [roleLoaded, setRoleLoaded] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string, email: string, fullName?: string) => {
    try {
      const { data: roleRows } = await (supabase as any).from('user_roles').select('role').eq('user_id', userId);
      const roleData = roleRows?.find((r: any) => r.role === 'super_admin' || r.role === 'doctor') || roleRows?.[0] || null;
      setRole(roleData?.role || null);

      let { data: profileData } = await (supabase as any).from('profiles').select('*').eq('id', userId).single();
      if (!profileData) {
        const { data: newProfile } = await (supabase as any).from('profiles').insert({
          id: userId,
          full_name: fullName || email,
          email: email,
        }).select().single();
        profileData = newProfile;
      }
      setProfile(profileData);
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => {
          fetchUserData(
            session.user.id,
            session.user.email || '',
            session.user.user_metadata?.full_name
          );
        }, 0);
      } else {
        setRole(null);
        setProfile(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(
          session.user.id,
          session.user.email || '',
          session.user.user_metadata?.full_name
        );
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password });

  const signUp = (email: string, password: string, fullName: string) =>
    supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, role, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
