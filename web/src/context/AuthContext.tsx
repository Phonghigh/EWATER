import {
  createContext, useContext, useEffect, useState, type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";

export type Role = "citizen" | "authority" | "leadership";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  home_lng: number | null;
  home_lat: number | null;
}

interface AuthValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  updateHomeLocation: (lng: number, lat: number) => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile(userId: string) {
      const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
      if (!cancelled) setProfile((data as Profile) ?? null);
    }

    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      if (data.session) await loadProfile(data.session.user.id);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (cancelled) return;
      setSession(newSession);
      if (newSession) {
        setLoading(true);
        await loadProfile(newSession.user.id);
        setLoading(false);
      } else {
        setProfile(null);
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string): Promise<string | null> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? error.message : null;
  }

  async function signOut(): Promise<void> {
    await supabase.auth.signOut();
  }

  async function updateHomeLocation(lng: number, lat: number): Promise<void> {
    if (!session) return;
    const { error } = await supabase
      .from("profiles")
      .update({ home_lng: lng, home_lat: lat })
      .eq("id", session.user.id);
    if (!error) setProfile((p) => (p ? { ...p, home_lng: lng, home_lat: lat } : p));
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, signIn, signOut, updateHomeLocation }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
