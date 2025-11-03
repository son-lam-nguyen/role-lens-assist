import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth/authContext";

interface RoleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  route: string;
  features: string[];
  buttonText?: string;
}

export const RoleCard = ({ title, description, icon: Icon, route, features, buttonText = "Go to Dashboard" }: RoleCardProps) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleNavigate = () => {
    // Support Worker requires authentication
    if (route === "/sw" && !isAuthenticated) {
      navigate(`/auth/login?next=${route}`);
    } else {
      navigate(route);
    }
  };
  
  return (
    <Card className="card-hover glass-card hover:shadow-2xl transition-all duration-300">
      <CardHeader>
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-5 shadow-xl">
          <Icon className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold">{title}</CardTitle>
        <CardDescription className="text-base leading-relaxed">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-3">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3 text-sm text-muted-foreground">
              <span className="text-accent mt-0.5 text-lg">✓</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <Button onClick={handleNavigate} className="w-full group" size="lg">
          {buttonText}
          <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
        </Button>
      </CardContent>
    </Card>
  );
};
