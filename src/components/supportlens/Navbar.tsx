import { useNavigate, useLocation } from "react-router-dom";
import { Stethoscope, Home, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth/authContext";

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();

  const getCurrentRole = () => {
    if (location.pathname.startsWith("/sw")) return "sw";
    if (location.pathname.startsWith("/client")) return "client";
    if (location.pathname.startsWith("/admin")) return "admin";
    return "home";
  };

  const handleRoleChange = (value: string) => {
    if (value === "home") navigate("/");
    else navigate(`/${value}`);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="fixed top-0 left-0 w-full h-16 z-50 bg-white/80 backdrop-blur border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            aria-label="Go to home"
          >
            <Stethoscope className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">SupportLens</h1>
          </button>

          {getCurrentRole() !== "home" && (
            <Select value={getCurrentRole()} onValueChange={handleRoleChange}>
              <SelectTrigger className="w-[180px]" aria-label="Switch role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sw">Support Worker</SelectItem>
                <SelectItem value="client">Client Portal</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="home">Home</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2" aria-label="User menu">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-xs">
                      {user ? getInitials(user.displayName) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden sm:inline">
                    {user?.displayName}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.displayName}</p>
                    <p className="text-xs text-muted-foreground">@{user?.username}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/auth/login?next=/sw")}
              aria-label="Sign in"
            >
              <User className="w-4 h-4 mr-2" />
              Sign In
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            aria-label="Go to home"
          >
            <Home className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </nav>
  );
};
