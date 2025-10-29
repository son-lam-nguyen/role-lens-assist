import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { userStore } from "@/lib/users/userStore";

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
    // Use a properly formatted test email that Supabase will accept
    const email = `${username}@test.supportlens.local`;
    const password = "DemoPassword2024!";
    
    console.log("🔐 Attempting Supabase auth for:", email);
    
    try {
      // Try to sign in first
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInData?.session) {
        console.log("✅ Signed in successfully");
        return;
      }

      // If sign in fails, try to sign up
      if (signInError) {
        console.log("⚠️ Sign in failed, attempting signup:", signInError.message);
        
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/sw`,
            data: {
              username: username,
            }
          }
        });
        
        if (signUpError) {
          console.error("❌ Supabase signup error:", signUpError);
          console.error("💡 IMPORTANT: Go to Supabase Dashboard > Authentication > Email Auth > Disable 'Confirm email'");
          return;
        }

        if (signUpData?.session) {
          console.log("✅ Signed up and auto-confirmed successfully");
        } else if (signUpData?.user && !signUpData?.session) {
          console.warn("⚠️ User created but needs email confirmation. Session not available yet.");
          console.error("💡 REQUIRED: Go to https://supabase.com/dashboard/project/jtojfoumstpmqswrtuas/auth/providers");
          console.error("💡 Then disable 'Confirm email' under Email Provider settings");
        }
      }
    } catch (error) {
      console.error("❌ Supabase authentication error:", error);
    }
  };

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const foundUser = userStore.getByUsername(username);

    if (!foundUser || foundUser.password !== password) {
      return { success: false, error: "Invalid username or password" };
    }

    if (!foundUser.active) {
      return { success: false, error: "Account is deactivated" };
    }

    const authUser: AuthUser = {
      username: foundUser.username,
      role: foundUser.role,
      displayName: foundUser.name,
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
