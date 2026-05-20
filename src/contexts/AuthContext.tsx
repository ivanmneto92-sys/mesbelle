import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { clearAppStorage } from "@/hooks/useLeads";

export type UserRole = "admin" | "vendedor" | "socio";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

async function fetchUserRole(userId: string): Promise<UserRole> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .single();
  return (data?.role as UserRole) || "vendedor";
}

async function fetchProfile(userId: string): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("nome")
    .eq("user_id", userId)
    .single();
  return data?.nome || "";
}

async function buildUser(supabaseUser: SupabaseUser): Promise<User> {
  const [role, nome] = await Promise.all([
    fetchUserRole(supabaseUser.id),
    fetchProfile(supabaseUser.id),
  ]);
  return {
    id: supabaseUser.id,
    name: nome || supabaseUser.email || "",
    email: supabaseUser.email || "",
    role,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Set up listener BEFORE getting session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // If the active user changed, wipe legacy localStorage from the previous account
          if (lastUserIdRef.current && lastUserIdRef.current !== session.user.id) {
            clearAppStorage();
          }
          lastUserIdRef.current = session.user.id;
          // Use setTimeout to avoid potential deadlock with Supabase client
          setTimeout(async () => {
            const appUser = await buildUser(session.user);
            setUser(appUser);
            setLoading(false);
          }, 0);
        } else {
          // Signed out — purge any sensitive data left in the browser
          clearAppStorage();
          lastUserIdRef.current = null;
          setUser(null);
          setLoading(false);
        }
      }
    );

    // Then check existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        lastUserIdRef.current = session.user.id;
        const appUser = await buildUser(session.user);
        setUser(appUser);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return !error;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    clearAppStorage();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
