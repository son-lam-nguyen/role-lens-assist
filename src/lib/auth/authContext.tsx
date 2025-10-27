import { createContext, useContext, useState, useEffect, ReactNode } from "react";
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

  // Load auth state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      } catch (e) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
  }, []);

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
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
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
