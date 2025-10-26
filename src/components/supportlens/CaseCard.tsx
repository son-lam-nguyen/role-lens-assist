import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { Case } from "@/lib/mock/mockCases";

interface CaseCardProps {
  case: Case;
  onOpenGuideline: () => void;
}

export const CaseCard = ({ case: caseData, onOpenGuideline }: CaseCardProps) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg">{caseData.title}</CardTitle>
            <CardDescription>{caseData.summary}</CardDescription>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {Math.round(caseData.score * 100)}% match
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {caseData.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="capitalize">
              {tag.replace("-", " ")}
            </Badge>
          ))}
        </div>

        {caseData.matchedKeywords.length > 0 && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Matched keywords:</span>{" "}
            {caseData.matchedKeywords.join(", ")}
          </div>
        )}

        <Button
          onClick={onOpenGuideline}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Open Guideline
        </Button>
      </CardContent>
    </Card>
  );
};
