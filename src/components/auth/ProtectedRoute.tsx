import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth/authContext";
import { toast } from "sonner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Please sign in to continue");
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <Navigate to={`/auth/login?next=${location.pathname}`} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground">
            You do not have permission to access this area.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
