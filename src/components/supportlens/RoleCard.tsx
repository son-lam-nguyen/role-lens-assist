import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface RoleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  route: string;
  features: string[];
}

export const RoleCard = ({ title, description, icon: Icon, route, features }: RoleCardProps) => {
  const navigate = useNavigate();
  
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="text-primary mt-0.5">•</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <Button onClick={() => navigate(route)} className="w-full" size="lg">
          Go to Dashboard
        </Button>
      </CardContent>
    </Card>
  );
};
