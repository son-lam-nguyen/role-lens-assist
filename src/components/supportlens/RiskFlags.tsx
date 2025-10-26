import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

interface RiskFlagsProps {
  flags: string[];
}

const flagColors: Record<string, string> = {
  "self-harm": "destructive",
  "suicide": "destructive",
  "violence": "destructive",
  "housing": "warning",
  "finance": "warning",
  "anxiety": "default",
  "family": "default",
  "addiction": "warning",
  "employment": "default",
  "work-stress": "default",
  "emotional-distress": "default",
};

export const RiskFlags = ({ flags }: RiskFlagsProps) => {
  if (flags.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No risk flags detected
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <AlertTriangle className="w-4 h-4 text-warning" />
        <span>Detected Risk Flags</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {flags.map((flag) => (
          <Badge
            key={flag}
            variant={flagColors[flag] as any || "default"}
            className="capitalize"
          >
            {flag.replace("-", " ")}
          </Badge>
        ))}
      </div>
    </div>
  );
};
