import { useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    // Auth state change handler with logging
    const handleAuthStateChange = (_event: string, session: Session | null) => {
      if (!isMounted) return;
      
      console.log('Auth state changed:', { event: _event, hasSession: !!session, userId: session?.user?.id });
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    // THEN check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (error) {
          console.error('Error getting session:', error);
        } else {
          console.log('Initial session check:', { hasSession: !!session, userId: session?.user?.id });
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      console.log('Attempting sign up:', { email });
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : '',
          data: {
            full_name: fullName,
          },
        },
      });
      
      console.log('Sign up result:', { hasError: !!error, hasData: !!data });
      return { data, error };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting sign in:', { email });
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      console.log('Sign in result:', { hasError: !!error, hasData: !!data, userId: data.user?.id });
      return { data, error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      console.log('Attempting sign out');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
      } else {
        console.log('Sign out successful');
      }
      
      return { error };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error: error as Error };
    }
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };
}
