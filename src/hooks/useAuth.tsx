import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthState = {
  user: User | null;
  session: Session | null;
  username: string | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<string | null>;
  signUp: (username: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

const DOMAIN = "clickchess.app";

export const usernameToEmail = (username: string) =>
  `${username.trim().toLowerCase()}@${DOMAIN}`;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const uid = session?.user.id;

    if (!uid) {
      setUsername(null);
      setIsAdmin(false);
      return;
    }

    let active = true;

    Promise.all([
      supabase
        .from("profiles")
        .select("username")
        .eq("id", uid)
        .maybeSingle(),

      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid)
        .eq("role", "admin")
        .maybeSingle(),
    ]).then(([profileResult, roleResult]) => {
      if (!active) return;

      setUsername(profileResult.data?.username ?? null);
      setIsAdmin(roleResult.data?.role === "admin");
    });

    return () => {
      active = false;
    };
  }, [session?.user.id]);

  const signIn: AuthState["signIn"] = async (name, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(name),
      password,
    });

    return error ? "Wrong username or password." : null;
  };

  const signUp: AuthState["signUp"] = async (name, password) => {
    const clean = name.trim().toLowerCase();

    if (!/^[a-z0-9_]{3,20}$/.test(clean))
      return "Username: 3-20 letters, numbers or underscores.";

    if (password.length < 6)
      return "Password must be at least 6 characters.";

    const { data, error } = await supabase.auth.signUp({
      email: usernameToEmail(clean),
      password,
      options: {
        data: {
          username: clean,
        },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes("already")) {
        return "That username is taken.";
      }
      return error.message;
    }

    if (data.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: data.user.id,
          username: clean,
        });

      if (profileError) {
        console.error(profileError);
      }

      setUsername(clean);
    }

    return null;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        session,
        username,
        isAdmin,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return ctx;
}