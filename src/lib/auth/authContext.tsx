import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { mockUsers, MockUser } from "@/lib/mock/mockUsers";

interface AuthUser {
  username: string;
  role: string;
  displayName: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "supportlens_auth";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);

  // Load auth state from localStorage on mount and check Supabase session
  useEffect(() => {
    const initAuth = async () => {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setUser(parsed);
          
          // Check if Supabase session exists
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            // Try to restore Supabase session
            await handleSupabaseAuth(parsed.username);
          }
        } catch (e) {
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      }
    };
    initAuth();
  }, []);

  const handleSupabaseAuth = async (username: string) => {
    // For demo purposes, use a valid email domain that Supabase accepts
    const email = `${username}@supportlens.app`;
    const password = "DemoPassword2024!"; // Demo password
    
    try {
      // Try to sign in first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // If sign in fails, try to sign up
      if (signInError) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/sw`,
          }
        });
        
        if (signUpError) {
          console.error("Supabase auth error:", signUpError);
        }
      }
    } catch (error) {
      console.error("Error with Supabase authentication:", error);
    }
  };

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const foundUser = mockUsers.find(
      (u) => u.username === username && u.password === password
    );

    if (!foundUser) {
      return { success: false, error: "Invalid username or password" };
    }

    const authUser: AuthUser = {
      username: foundUser.username,
      role: foundUser.role,
      displayName: foundUser.displayName,
    };

    setUser(authUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
    
    // Also authenticate with Supabase
    await handleSupabaseAuth(foundUser.username);
    
    return { success: true };
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    
    // Also sign out from Supabase
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
