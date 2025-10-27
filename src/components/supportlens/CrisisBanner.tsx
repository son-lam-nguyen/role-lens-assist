import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { crisisContactsAU } from "@/lib/mock/mockSettings";

interface CrisisBannerProps {
  onShowContacts?: () => void;
}

export const CrisisBanner = ({ onShowContacts }: CrisisBannerProps) => {
  return (
    <Alert variant="destructive" className="border-2 animate-pulse-border bg-gradient-to-r from-destructive/10 to-destructive/5">
      <AlertTriangle className="h-5 w-5 animate-pulse" />
      <AlertTitle className="text-lg font-bold">Crisis Support Available</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>
          If you're in crisis or having thoughts of self-harm, please reach out for immediate support:
        </p>
        <div className="space-y-2 bg-destructive-foreground/10 p-4 rounded-lg">
          <div className="flex items-center gap-2 font-bold">
            <Phone className="w-4 h-4" />
            <span>Emergency Services: 000</span>
          </div>
          <div className="flex items-center gap-2 font-bold">
            <Phone className="w-4 h-4" />
            <span>Lifeline: 13 11 14 (24/7)</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            <span>Suicide Call Back Service: 1300 659 467</span>
          </div>
        </div>
        {onShowContacts && (
          <Button
            variant="outline"
            size="sm"
            onClick={onShowContacts}
            className="bg-background hover:bg-background/80"
          >
            View All Crisis Contacts
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};
