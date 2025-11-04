import { useState, useRef } from "react";
import { Camera, Upload, AlertTriangle, CheckCircle2, Clock, Shield, Zap, Home, TrendingUp, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

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
      
      // Validate response structure
      if (!data || !data.summary || !data.hazards || !data.suggestions) {
        console.error("Invalid response structure:", data);
        throw new Error("Invalid response format from analysis service");
      }
      
      setResult(data);
      toast.success("Analysis complete!");
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Failed to analyze environment. Please try again.");
      setResult(null);
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
        {result && result.summary && (
          <div className="space-y-5">
            {/* Hero Stats Card */}
            <Card className="relative overflow-hidden border-0 shadow-lg animate-scale-in">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent" />
              <div className="relative p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Home className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold capitalize">
                        {result.environment_context}
                      </h2>
                      <p className="text-sm text-muted-foreground">Environment Analysis</p>
                    </div>
                  </div>
                  <Badge 
                    variant="default" 
                    className="h-8 px-4 bg-primary/10 text-primary border-primary/20"
                  >
                    Complete
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-destructive/5 rounded-2xl transition-all group-hover:bg-destructive/10" />
                    <div className="relative p-4 text-center space-y-1">
                      <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-destructive/10 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                      </div>
                      <div className="text-3xl font-bold text-destructive">
                        {result.summary.hazard_count}
                      </div>
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Hazards
                      </div>
                    </div>
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-0 bg-success/5 rounded-2xl transition-all group-hover:bg-success/10" />
                    <div className="relative p-4 text-center space-y-1">
                      <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-success/10 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-success" />
                      </div>
                      <div className="text-3xl font-bold text-success">
                        {result.summary.suggestion_count}
                      </div>
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Actions
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Hazards Section */}
            {result.hazards && result.hazards.length > 0 && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center gap-2 px-1">
                  <div className="w-1 h-6 bg-destructive rounded-full" />
                  <h3 className="text-lg font-bold">Priority Hazards</h3>
                </div>
                <div className="space-y-3">
                  {result.hazards.map((hazard, idx) => {
                    const severityConfig = {
                      critical: { bg: "bg-destructive/10", border: "border-destructive/30", icon: "🔴" },
                      high: { bg: "bg-destructive/10", border: "border-destructive/30", icon: "🔴" },
                      medium: { bg: "bg-warning/10", border: "border-warning/30", icon: "🟡" },
                      low: { bg: "bg-muted/50", border: "border-border", icon: "🟢" }
                    }[hazard.severity] || { bg: "bg-muted/50", border: "border-border", icon: "⚪" };

                    return (
                      <Card
                        key={idx}
                        className={`overflow-hidden border-2 ${severityConfig.border} transition-all hover:scale-[1.02] hover:shadow-md`}
                        style={{ animationDelay: `${idx * 100}ms` }}
                      >
                        <div className={`${severityConfig.bg} p-4 space-y-2`}>
                          <div className="flex items-start gap-3">
                            <span className="text-2xl flex-shrink-0 mt-0.5">{severityConfig.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h4 className="font-semibold text-base leading-tight">
                                  {hazard.title}
                                </h4>
                                <Badge 
                                  variant={getSeverityColor(hazard.severity) as any}
                                  className="uppercase text-xs font-bold shrink-0"
                                >
                                  {hazard.severity}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {hazard.reason}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Tasks - Grouped by Duration */}
            {result.suggestions && result.suggestions.length > 0 && (
              <div className="space-y-3 animate-fade-in" style={{ animationDelay: "200ms" }}>
                <div className="flex items-center gap-2 px-1">
                  <div className="w-1 h-6 bg-success rounded-full" />
                  <h3 className="text-lg font-bold">Quick Improvements</h3>
                </div>
                
                {[5, 10, 15, 20].map(duration => {
                  const tasksForDuration = result.suggestions.filter(
                  s => s.duration_minutes === duration
                );
                
                if (tasksForDuration.length === 0) return null;

                const durationConfig = {
                  5: { color: "success", icon: Zap, label: "Quick Win" },
                  10: { color: "primary", icon: Clock, label: "Short Task" },
                  15: { color: "warning", icon: Clock, label: "Medium Task" },
                  20: { color: "warning", icon: Clock, label: "Longer Task" }
                }[duration] || { color: "muted", icon: Clock, label: "Task" };

                const IconComponent = durationConfig.icon;

                return (
                  <div key={duration} className="space-y-2">
                    <div className="flex items-center gap-2 px-2">
                      <IconComponent className={`w-4 h-4 text-${durationConfig.color}`} />
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {durationConfig.label}s • {duration} min
                      </span>
                    </div>
                    {tasksForDuration.map((task, idx) => (
                      <Card
                        key={idx}
                        className="border-l-4 border-l-success/50 hover:border-l-success transition-all hover:shadow-md group"
                      >
                        <div className="p-4 space-y-2">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                              <CheckCircle2 className="w-4 h-4 text-success" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-base mb-1 leading-tight">
                                {task.task}
                              </h4>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {task.reason}
                              </p>
                            </div>
                            <Badge 
                              variant="outline" 
                              className="shrink-0 border-success/30 text-success"
                            >
                              {task.duration_minutes}m
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                );
                })}
              </div>
            )}

            {/* Safety Tips */}
            {result.tips && result.tips.length > 0 && (
              <Card 
                className="border-2 border-accent/30 bg-gradient-to-br from-accent/5 to-transparent animate-fade-in"
                style={{ animationDelay: "300ms" }}
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Pro Safety Tips</h3>
                      <p className="text-xs text-muted-foreground">Expert recommendations</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {result.tips.map((tip, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 rounded-xl bg-card/50 hover:bg-card transition-colors"
                      >
                        <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-accent">{idx + 1}</span>
                        </div>
                        <p className="text-sm leading-relaxed flex-1">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2 animate-fade-in" style={{ animationDelay: "400ms" }}>
              <Button
                onClick={() => {
                  setImage(null);
                  setResult(null);
                }}
                variant="outline"
                size="lg"
                className="h-14 font-semibold"
              >
                <Camera className="w-5 h-5 mr-2" />
                New Scan
              </Button>
              <Button
                onClick={() => {
                  const shareText = `🏠 ${result.environment_context} Analysis\n\n⚠️ ${result.summary.hazard_count} hazards detected\n✅ ${result.summary.suggestion_count} improvements suggested`;
                  navigator.share?.({
                    title: "Environment Scan Results",
                    text: shareText,
                  }).catch(() => {
                    navigator.clipboard?.writeText(shareText);
                    toast.success("Results copied to clipboard!");
                  });
                }}
                size="lg"
                className="h-14 font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Share
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
