import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Settings as SettingsIcon } from "lucide-react";
import { defaultSettings, crisisContactsAU } from "@/lib/mock/mockSettings";
import { toast } from "sonner";

const Settings = () => {
  const [settings, setSettings] = useState(defaultSettings);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    toast.success("Setting updated");
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="bg-gradient-to-r from-muted-foreground/5 via-primary/5 to-transparent rounded-2xl p-6 border border-muted-foreground/10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-muted-foreground flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>
        <p className="text-foreground/70 text-base ml-13">
          Configure application preferences and view crisis contacts
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card className="card-hover border-l-4 border-l-primary bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <SettingsIcon className="w-4 h-4 text-primary" />
                </div>
                Application Settings
              </CardTitle>
              <CardDescription>Manage default behaviors and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-delete">Auto-delete audio</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically delete audio files after 30 days
                  </p>
                </div>
                <Switch
                  id="auto-delete"
                  checked={settings.autoDeleteAudio}
                  onCheckedChange={() => handleToggle("autoDeleteAudio")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="mask-pii">Mask PII by default</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically anonymize personally identifiable information
                  </p>
                </div>
                <Switch
                  id="mask-pii"
                  checked={settings.maskPIIDefault}
                  onCheckedChange={() => handleToggle("maskPIIDefault")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="confidence">Show confidence score</Label>
                  <p className="text-sm text-muted-foreground">
                    Display transcription confidence metrics
                  </p>
                </div>
                <Switch
                  id="confidence"
                  checked={settings.showConfidenceScore}
                  onCheckedChange={() => handleToggle("showConfidenceScore")}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-accent/5 border-accent">
            <CardHeader>
              <CardTitle className="text-sm">Privacy & Data</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                All data is stored securely and encrypted. Audio files are processed locally
                and never transmitted without explicit consent. PII masking uses pattern matching
                and may not catch all instances. Always review transcripts for sensitive information.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="card-hover border-l-4 border-l-destructive bg-gradient-to-br from-destructive/5 to-transparent">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Phone className="w-4 h-4 text-destructive" />
              </div>
              Australian Crisis Contacts
            </CardTitle>
            <CardDescription>Emergency and crisis support services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {crisisContactsAU.map((contact) => (
                <div
                  key={contact.id}
                  className="p-4 rounded-lg border bg-card space-y-2"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold">{contact.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {contact.description}
                      </p>
                    </div>
                    <Badge
                      variant={contact.available === "24/7" ? "default" : "secondary"}
                      className="shrink-0"
                    >
                      {contact.available}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    asChild
                  >
                    <a href={`tel:${contact.phone.replace(/\s/g, '')}`}>
                      <Phone className="w-3 h-3 mr-2" />
                      {contact.phone}
                    </a>
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm font-medium text-destructive">
                ⚠️ In life-threatening emergencies, always call 000
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
