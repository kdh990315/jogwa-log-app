import { type PropsWithChildren, useEffect, useState } from "react";
import { AppState } from "react-native";

import { getSession } from "@/api/auth";
import { supabase, type Session } from "@/api/supabase";
import { AuthContext } from "@/hooks/use-auth";

export default function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      try {
        const nextSession = await getSession();

        if (isMounted) {
          setSession(nextSession);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoading(false);
    });

    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        supabase.auth.startAutoRefresh();
        return;
      }

      supabase.auth.stopAutoRefresh();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      appStateSubscription.remove();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: Boolean(session),
        isLoading,
        session,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
