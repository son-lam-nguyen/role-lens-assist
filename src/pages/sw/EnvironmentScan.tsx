import { useState, useRef } from "react";
import { Camera, Upload, AlertTriangle, CheckCircle2, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AnalysisResult {
  status: string;
  environment_context: string;
  hazards: Array<{
    title: string;
    severity: "low" | "medium" | "high" | "critical";
    reason: string;
  }>;
  suggestions: Array<{
    task: string;
    duration_minutes: number;
    reason: string;
  }>;
  summary: {
    hazard_count: number;
    suggestion_count: number;
  };
  tips: string[];
}

export default function EnvironmentScan() {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target?.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image || !consentGiven) {
      toast.error("Please ensure client consent is given and image is selected");
      return;
    }

    setAnalyzing(true);
    try {
      const response = await fetch("https://n8n.birthdaymessaging.space/webhook/envsafe-scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image }),
      });

      if (!response.ok) {
        throw new Error(`Webhook error: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
      toast.success("Analysis complete!");
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Failed to analyze environment. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "warning";
      default:
        return "secondary";
    }
  };


  return (
    <div className="min-h-screen bg-background pb-20 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto pt-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Environment Scan</h1>
          <p className="text-muted-foreground">
            AI-powered safety and task analysis
          </p>
        </div>

        {/* Privacy Notice */}
        <Card className="p-4 bg-accent/10 border-accent/20">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <h3 className="font-semibold text-sm">Privacy & Consent</h3>
              <p className="text-xs text-muted-foreground">
                Photos are analyzed privately and not stored. Always obtain clear client
                consent before capturing environment images.
              </p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  className="w-4 h-4 rounded border-accent text-accent focus:ring-accent"
                />
                <span className="text-sm">Client consent obtained</span>
              </label>
            </div>
          </div>
        </Card>

        {/* Upload Section */}
        {!image && (
          <div className="space-y-3">
            <Button
              onClick={() => cameraInputRef.current?.click()}
              disabled={!consentGiven}
              className="w-full h-32 flex flex-col gap-2 bg-primary hover:bg-primary/90"
              size="lg"
            >
              <Camera className="w-8 h-8" />
              <span>Capture Photo</span>
            </Button>

            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={!consentGiven}
              variant="outline"
              className="w-full h-32 flex flex-col gap-2"
              size="lg"
            >
              <Upload className="w-8 h-8" />
              <span>Upload Photo</span>
            </Button>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* Image Preview & Analyze */}
        {image && !result && (
          <Card className="p-4 space-y-4">
            <img
              src={image}
              alt="Environment preview"
              className="w-full h-64 object-cover rounded-lg"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="flex-1"
                size="lg"
              >
                {analyzing ? "Analyzing..." : "Analyze Environment"}
              </Button>
              <Button
                onClick={() => setImage(null)}
                variant="outline"
                disabled={analyzing}
              >
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6 fade-in">
            {/* Environment Context & Summary */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Environment Analysis</h2>
                <Badge variant="default" className="text-sm capitalize">
                  {result.environment_context}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50">
                <div className="text-center">
                  <div className="text-2xl font-bold text-destructive">
                    {result.summary.hazard_count}
                  </div>
                  <div className="text-sm text-muted-foreground">Hazards Found</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">
                    {result.summary.suggestion_count}
                  </div>
                  <div className="text-sm text-muted-foreground">Suggestions</div>
                </div>
              </div>
            </Card>

            {/* Hazards */}
            {result.hazards.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <h2 className="text-xl font-semibold">Detected Hazards</h2>
                </div>
                <div className="space-y-3">
                  {result.hazards.map((hazard, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-lg border border-border bg-card space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold">{hazard.title}</h3>
                        <Badge variant={getSeverityColor(hazard.severity) as any}>
                          {hazard.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {hazard.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Suggested Tasks */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <h2 className="text-xl font-semibold">Suggested Tasks</h2>
              </div>
              <div className="space-y-3">
                {result.suggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg border border-border bg-card space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold">{suggestion.task}</h3>
                      <Badge variant="outline" className="whitespace-nowrap">
                        <Clock className="w-3 h-3 mr-1" />
                        {suggestion.duration_minutes}min
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {suggestion.reason}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Safety Tips */}
            {result.tips && result.tips.length > 0 && (
              <Card className="p-6 bg-accent/10 border-accent/20">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-accent" />
                  <h2 className="text-xl font-semibold">Safety Tips</h2>
                </div>
                <ul className="space-y-2">
                  {result.tips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setImage(null);
                  setResult(null);
                }}
                variant="outline"
                className="flex-1"
              >
                New Scan
              </Button>
              <Button
                onClick={() => {
                  const shareText = `Environment Scan: ${result.environment_context}\n${result.summary.hazard_count} hazards found, ${result.summary.suggestion_count} suggestions provided.`;
                  navigator.share?.({
                    title: "Environment Scan Results",
                    text: shareText,
                  }).catch(() => {
                    toast.info("Sharing not supported on this device");
                  });
                }}
                className="flex-1"
              >
                Share Report
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
