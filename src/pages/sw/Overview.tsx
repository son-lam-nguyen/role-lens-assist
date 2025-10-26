import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Clock, TrendingUp } from "lucide-react";
import { mockTranscripts } from "@/lib/mock/mockTranscripts";

const Overview = () => {
  const navigate = useNavigate();

  const kpis = [
    { label: "Sessions Summarized", value: "24", icon: FileText, trend: "+8 this week" },
    { label: "Guidelines Attached", value: "47", icon: TrendingUp, trend: "+12 this week" },
    { label: "Risk Flags Detected", value: "6", icon: Badge, trend: "2 high priority" },
    { label: "Avg. Time Saved", value: "18m", icon: Clock, trend: "per session" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Support Worker Dashboard</h1>
        <p className="text-muted-foreground">
          AI-powered tools for efficient case documentation and evidence-based support
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="pb-2">
              <CardDescription className="text-sm">{kpi.label}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">{kpi.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{kpi.trend}</p>
                </div>
                <kpi.icon className="w-8 h-8 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Transcripts</CardTitle>
            <CardDescription>Your latest session recordings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockTranscripts.map((transcript) => (
                <div
                  key={transcript.id}
                  className="flex items-start justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => navigate("/sw/upload")}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && navigate("/sw/upload")}
                >
                  <div className="space-y-1 flex-1">
                    <h4 className="font-medium">{transcript.title}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{Math.floor(transcript.durationSec / 60)}m {transcript.durationSec % 60}s</span>
                      <span>•</span>
                      <span>{new Date(transcript.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {transcript.flags.slice(0, 3).map((flag) => (
                      <Badge key={flag} variant="secondary" className="text-xs">
                        {flag}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and workflows</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => navigate("/sw/upload")}
              className="w-full justify-start"
              size="lg"
            >
              <Upload className="w-5 h-5 mr-3" />
              Upload New Audio
            </Button>
            <Button
              onClick={() => navigate("/sw/cases")}
              variant="outline"
              className="w-full justify-start"
              size="lg"
            >
              <FileText className="w-5 h-5 mr-3" />
              Search Similar Cases
            </Button>
            <Button
              onClick={() => navigate("/sw/notes")}
              variant="outline"
              className="w-full justify-start"
              size="lg"
            >
              <FileText className="w-5 h-5 mr-3" />
              Create SOAP Note
            </Button>

            <div className="pt-4 mt-4 border-t">
              <h4 className="text-sm font-medium mb-3">Recent Activity</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>✓ Uploaded "Family Conflict" - 2 hours ago</p>
                <p>✓ Exported SOAP note - 5 hours ago</p>
                <p>✓ Added 3 guidelines to notes - Yesterday</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Overview;
