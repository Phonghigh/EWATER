import {
  createContext, useContext, useEffect, useState, type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";

// No "citizen" role anymore (the redesign dropped the citizen /my-area flow —
// see tasks/backlog/phase-0.md P0-04). A null `session`/`profile` now means
// "guest": still a valid, supported state (guests can view the Dashboard),
// not just a loading/unauthenticated placeholder.
export type Role = "authority" | "admin";

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
  guestMode: boolean;
  enterGuestMode: () => void;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

const GUEST_MODE_KEY = "ewater-guest-mode";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  // "Guest mode" is an explicit choice (the Login page's "continue as
  // guest" button), not the default for an unauthenticated visitor — see
  // RequireGuestOrRole, which sends anyone without a session AND without
  // this flag to /login first. Persisted per-tab (sessionStorage) so a
  // page refresh doesn't bounce a guest back to the login screen.
  const [guestMode, setGuestMode] = useState<boolean>(
    () => typeof sessionStorage !== "undefined" && sessionStorage.getItem(GUEST_MODE_KEY) === "1"
  );

  function enterGuestMode() {
    try {
      sessionStorage.setItem(GUEST_MODE_KEY, "1");
    } catch {
      /* ignore */
    }
    setGuestMode(true);
  }

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
    try {
      sessionStorage.removeItem(GUEST_MODE_KEY);
    } catch {
      /* ignore */
    }
    setGuestMode(false);
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, guestMode, enterGuestMode, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
