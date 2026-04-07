import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
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
  const requestIdRef = useRef(0);

  const fetchUserData = async (nextUser: User) => {
    const requestId = ++requestIdRef.current;

    setLoading(true);
    setRoleLoaded(false);

    try {
      const [roleResult, profileResult] = await Promise.all([
        supabase.rpc('get_user_role', { _user_id: nextUser.id }),
        (supabase as any).from('profiles').select('*').eq('id', nextUser.id).maybeSingle(),
      ]);

      if (requestId !== requestIdRef.current) return;

      if (roleResult.error) throw roleResult.error;
      if (profileResult.error) throw profileResult.error;

      let profileData = profileResult.data;

      if (!profileData) {
        const { data: newProfile, error: createProfileError } = await (supabase as any)
          .from('profiles')
          .upsert({
            id: nextUser.id,
            full_name: nextUser.user_metadata?.full_name || nextUser.email || '',
            email: nextUser.email || '',
          }, { onConflict: 'id' })
          .select()
          .maybeSingle();

        if (requestId !== requestIdRef.current) return;
        if (createProfileError) throw createProfileError;

        profileData = newProfile;
      }

      setRole((roleResult.data as AppRole) || null);
      setProfile(profileData || null);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      console.error('Error fetching user data:', err);
      setRole(null);
      setProfile(null);
    } finally {
      if (requestId !== requestIdRef.current) return;
      setRoleLoaded(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    let isActive = true;
    let initialSessionResolved = false;

    const syncAuthState = (nextSession: Session | null) => {
      if (!isActive) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!nextSession?.user) {
        requestIdRef.current += 1;
        setRole(null);
        setRoleLoaded(true);
        setProfile(null);
        setLoading(false);
        return;
      }

      void fetchUserData(nextSession.user);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!isActive) return;
      if (!initialSessionResolved && event === 'INITIAL_SESSION') return;
      syncAuthState(nextSession);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isActive) return;
      initialSessionResolved = true;
      syncAuthState(session);
    });

    return () => {
      isActive = false;
      requestIdRef.current += 1;
      subscription.unsubscribe();
    };
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
    <AuthContext.Provider value={{ user, session, role, roleLoaded, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
