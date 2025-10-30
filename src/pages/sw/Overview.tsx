import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Clock, TrendingUp, Mic, Play, Users, AlertTriangle, Timer, Zap, ArrowRight } from "lucide-react";
import { RecorderModal } from "@/components/recorder/RecorderModal";
import { recordingsStore, Recording } from "@/lib/recordings/store";
import { clientStore, Client } from "@/lib/clients/store";
import { Progress } from "@/components/ui/progress";

const Overview = () => {
  const navigate = useNavigate();
  const [openRecorder, setOpenRecorder] = useState(false);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const [recordingsData, clientsData] = await Promise.all([
        recordingsStore.getAll(),
        clientStore.listAll(),
      ]);
      setRecordings(recordingsData);
      setClients(clientsData);
    };
    loadData();
  }, [openRecorder]);

  const getClientName = (clientId?: string) => {
    if (!clientId) return "Unassigned";
    const client = clients.find(c => c.id === clientId);
    return client?.name || "Unknown Client";
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const kpis = [
    { 
      label: "Total Clients", 
      value: clients.length.toString(), 
      icon: Users, 
      trend: `${recordings.length} recordings`,
      color: "from-blue-500/20 to-blue-600/5",
      iconColor: "text-blue-600",
      progress: Math.min((clients.length / 50) * 100, 100)
    },
    { 
      label: "Guidelines Attached", 
      value: "47", 
      icon: FileText, 
      trend: "+12 this week",
      color: "from-accent/20 to-accent/5",
      iconColor: "text-accent",
      progress: 78
    },
    { 
      label: "Risk Flags Detected", 
      value: "6", 
      icon: AlertTriangle, 
      trend: "2 high priority",
      color: "from-warning/20 to-warning/5",
      iconColor: "text-warning",
      progress: 25
    },
    { 
      label: "Avg. Time Saved", 
      value: "18m", 
      icon: Timer, 
      trend: "per session",
      color: "from-primary/20 to-primary/5",
      iconColor: "text-primary",
      progress: 85
    },
  ];

  return (
    <div className="space-y-6 fade-in">
      <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-transparent rounded-2xl p-6 border border-primary/10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold">Support Worker Dashboard</h1>
        </div>
        <p className="text-foreground/70 text-base ml-13">
          AI-powered tools for efficient case documentation and evidence-based support
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, idx) => (
          <Card 
            key={kpi.label} 
            className={`card-hover overflow-hidden border-l-4 bg-gradient-to-br ${kpi.color}`}
            style={{ 
              animationDelay: `${idx * 0.1}s`,
              borderLeftColor: `hsl(var(--${kpi.iconColor.replace('text-', '')}))` 
            }}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider">{kpi.label}</CardDescription>
                <div className={`w-10 h-10 rounded-lg bg-background/50 flex items-center justify-center ${kpi.iconColor}`}>
                  <kpi.icon className="w-5 h-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-4xl font-bold tracking-tight">{kpi.value}</div>
              <div className="space-y-1">
                <Progress value={kpi.progress} className="h-1.5" />
                <p className="text-xs text-muted-foreground font-medium">{kpi.trend}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="card-hover bg-gradient-to-br from-background to-muted/20">
        <CardHeader className="border-b bg-background/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Mic className="w-4 h-4 text-primary" />
                </div>
                Recent Recordings
              </CardTitle>
              <CardDescription>Your latest audio recordings</CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate("/sw/recordings")}
              className="gap-1"
            >
              View all
              <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {recordings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-xl border-2 border-dashed">
              <Mic className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="font-medium">No recordings yet</p>
              <p className="text-sm">Start by uploading or recording audio</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recordings.slice(0, 5).map((recording, idx) => (
                <div
                  key={recording.id}
                  className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:border-primary/50 hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer group"
                  onClick={() => navigate(`/sw/recordings`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && navigate("/sw/recordings")}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 text-primary" />
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <h4 className="font-semibold group-hover:text-primary transition-colors truncate">{recording.name}</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{formatDuration(recording.duration)}</span>
                      <span>•</span>
                      <span>{new Date(recording.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {recording.clientId && (
                    <Badge variant="outline" className="text-xs bg-background">
                      {getClientName(recording.clientId)}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="card-hover border-l-4 border-l-primary bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-6">
            <Button
              onClick={() => navigate("/sw/upload")}
              className="w-full justify-between group h-auto py-4"
              size="lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Upload Audio</div>
                  <div className="text-xs opacity-90">Analyze new recordings</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </CardContent>
        </Card>

        <Card className="card-hover border-l-4 border-l-accent bg-gradient-to-br from-accent/5 to-transparent">
          <CardContent className="p-6">
            <Button
              onClick={() => setOpenRecorder(true)}
              variant="outline"
              className="w-full justify-between group h-auto py-4 hover:bg-accent/10 hover:border-accent"
              size="lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Mic className="w-5 h-5 text-accent" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Record Audio</div>
                  <div className="text-xs text-muted-foreground">Start live recording</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </CardContent>
        </Card>

        <Card className="card-hover border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-500/5 to-transparent">
          <CardContent className="p-6">
            <Button
              onClick={() => navigate("/sw/clients")}
              variant="outline"
              className="w-full justify-between group h-auto py-4 hover:bg-blue-500/10 hover:border-blue-500"
              size="lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Manage Clients</div>
                  <div className="text-xs text-muted-foreground">View all clients</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-muted/50 to-background border-dashed">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background border">
              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-accent text-xs">✓</span>
              </div>
              <div className="flex-1">
                <p className="font-medium">Uploaded "Family Conflict"</p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background border">
              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-accent text-xs">✓</span>
              </div>
              <div className="flex-1">
                <p className="font-medium">Exported SOAP note</p>
                <p className="text-xs text-muted-foreground">5 hours ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background border">
              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-accent text-xs">✓</span>
              </div>
              <div className="flex-1">
                <p className="font-medium">Added 3 guidelines to notes</p>
                <p className="text-xs text-muted-foreground">Yesterday</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <RecorderModal open={openRecorder} onOpenChange={setOpenRecorder} />
    </div>
  );
};

export default Overview;
