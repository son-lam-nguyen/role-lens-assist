import { useNavigate, useLocation } from "react-router-dom";
import { Stethoscope, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

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

  return (
    <nav className="border-b bg-card sticky top-0 z-50 backdrop-blur">
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

        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          aria-label="Go to home"
        >
          <Home className="w-5 h-5" />
        </Button>
      </div>
    </nav>
  );
};
