import { useState, useRef } from "react";
import { Camera, Upload, AlertTriangle, CheckCircle2, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AnalysisResult {
  hazards: Array<{
    type: string;
    severity: "low" | "medium" | "high" | "critical";
    description: string;
    location?: string;
  }>;
  tasks: Array<{
    title: string;
    duration: 5 | 10 | 20;
    priority: "low" | "medium" | "high";
    description: string;
  }>;
  overallSafety: "safe" | "concerns" | "unsafe";
  summary: string;
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
      const { data, error } = await supabase.functions.invoke("analyze-environment", {
        body: { image },
      });

      if (error) throw error;
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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
            {/* Overall Safety */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Overall Assessment</h2>
                <Badge
                  variant={
                    result.overallSafety === "safe"
                      ? "default"
                      : result.overallSafety === "concerns"
                      ? "secondary"
                      : "destructive"
                  }
                  className="text-sm"
                >
                  {result.overallSafety === "safe"
                    ? "Safe"
                    : result.overallSafety === "concerns"
                    ? "Minor Concerns"
                    : "Unsafe"}
                </Badge>
              </div>
              <p className="text-muted-foreground">{result.summary}</p>
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
                        <h3 className="font-semibold">{hazard.type}</h3>
                        <Badge variant={getSeverityColor(hazard.severity) as any}>
                          {hazard.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {hazard.description}
                      </p>
                      {hazard.location && (
                        <p className="text-xs text-muted-foreground">
                          Location: {hazard.location}
                        </p>
                      )}
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
                {result.tasks.map((task, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg border border-border bg-card space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold">{task.title}</h3>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="whitespace-nowrap">
                          <Clock className="w-3 h-3 mr-1" />
                          {task.duration}min
                        </Badge>
                        <Badge variant={getPriorityColor(task.priority) as any}>
                          {task.priority}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {task.description}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

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
                  navigator.share?.({
                    title: "Environment Scan Results",
                    text: result.summary,
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
