import { Progress } from "@/components/ui/progress";

interface ConfidenceMeterProps {
  confidence: number;
}

export const ConfidenceMeter = ({ confidence }: ConfidenceMeterProps) => {
  const percentage = Math.round(confidence * 100);

  const getColor = () => {
    if (percentage >= 80) return "bg-success";
    if (percentage >= 60) return "bg-warning";
    return "bg-destructive";
  };

  const getLabel = () => {
    if (percentage >= 80) return "High Confidence";
    if (percentage >= 60) return "Medium Confidence";
    return "Low Confidence";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Transcription Confidence</span>
        <span className="text-muted-foreground">{percentage}%</span>
      </div>
      <Progress value={percentage} className="h-2" />
      <p className="text-xs text-muted-foreground">{getLabel()}</p>
    </div>
  );
};
