import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FileDropzone } from "@/components/supportlens/FileDropzone";
import { TranscriptViewer } from "@/components/supportlens/TranscriptViewer";
import { RiskFlags } from "@/components/supportlens/RiskFlags";
import { ConfidenceMeter } from "@/components/supportlens/ConfidenceMeter";
import { Transcript, processAudioMock } from "@/lib/mock/mockTranscripts";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FileText, Send, AlertCircle } from "lucide-react";
import { recordingsStore } from "@/lib/recordings/store";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Upload = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [webhookResponse, setWebhookResponse] = useState<any>(null);
  const [piiMasked, setPiiMasked] = useState(true);
  const [recordingDuration, setRecordingDuration] = useState<number | undefined>(undefined);

  // Handle importing recording from the recordings page or recorder modal
  useEffect(() => {
    const loadRecording = async () => {
      const from = searchParams.get('from');
      const recordingId = searchParams.get('id');
      
      if ((from === 'recordings' || from === 'recorder') && recordingId) {
        const recording = await recordingsStore.get(recordingId);
        if (recording && recording.url) {
          try {
            // Fetch the blob from the signed URL
            const response = await fetch(recording.url);
            const blob = await response.blob();
            const file = new File([blob], recording.name, { type: blob.type });
            setSelectedFile(file);
            setRecordingDuration(recording.duration);
            
            // Auto-process if coming from recorder
            if (from === 'recorder') {
              setTimeout(() => {
                handleProcessRecording(file);
              }, 100);
            } else {
              toast.success(`Loaded recording: ${recording.name}`);
            }
          } catch (error) {
            console.error('Error loading recording:', error);
            toast.error("Failed to load recording");
          }
        } else {
          toast.error("Recording not found");
        }
      }
    };
    
    loadRecording();
  }, [searchParams]);

  const handleProcessRecording = async (file: File) => {
    setIsProcessing(true);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const formData = new FormData();
      formData.append('data', file);
      formData.append('filename', file.name);
      formData.append('filesize', file.size.toString());

      const response = await fetch('https://n8n.birthdaymessaging.space/webhook-test/f936540f-d473-4f4d-87d5-0bbcb3d05612', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Webhook request failed');
      }

      const webhookResult = await response.json();
      console.log('Webhook response:', webhookResult);
      
      // Store webhook response for display
      setWebhookResponse(webhookResult);
      
      // Try to parse transcript data from webhook response
      const parsedTranscript = parseWebhookResponse(webhookResult);
      
      setProgress(100);
      setTranscript(parsedTranscript);
      toast.success("Audio processed successfully!");
    } catch (error) {
      console.error('Webhook error:', error);
      toast.error("Failed to process audio");
    } finally {
      setIsProcessing(false);
      clearInterval(progressInterval);
    }
  };

  // Parse webhook response to extract transcript data
  const parseWebhookResponse = (data: any): Transcript => {
    // Extract transcript text (try common field names)
    const transcriptText = data.transcript || data.text || data.transcription || 
                          data.transcript_text || data.content || 
                          JSON.stringify(data, null, 2);

    // Extract summary/key points
    const tldr = data.summary ? 
                 (Array.isArray(data.summary) ? data.summary : [data.summary]) :
                 data.key_points ? 
                 (Array.isArray(data.key_points) ? data.key_points : [data.key_points]) :
                 data.tldr ?
                 (Array.isArray(data.tldr) ? data.tldr : [data.tldr]) :
                 ['Processing complete'];

    // Extract key phrases
    const keyphrases = data.key_phrases ?
                      (Array.isArray(data.key_phrases) ? data.key_phrases : [data.key_phrases]) :
                      data.keyphrases ?
                      (Array.isArray(data.keyphrases) ? data.keyphrases : [data.keyphrases]) :
                      data.keywords ?
                      (Array.isArray(data.keywords) ? data.keywords : [data.keywords]) :
                      [];

    // Extract confidence score
    const confidence = data.confidence_score || data.confidence || 
                      data.accuracy || 0.85;

    // Extract risk flags
    const rawFlags = data.risk_flags ?
                    (Array.isArray(data.risk_flags) ? data.risk_flags : [data.risk_flags]) :
                    data.flags ?
                    (Array.isArray(data.flags) ? data.flags : [data.flags]) :
                    data.risk_analysis ?
                    (Array.isArray(data.risk_analysis) ? data.risk_analysis : [data.risk_analysis]) :
                    [];

    const flags = rawFlags.map((flag: any) => {
      if (typeof flag === 'string') {
        return flag;
      }
      return flag.type || flag.name || flag.description || String(flag);
    });

    // Extract duration
    const durationSec = data.duration || data.duration_sec || data.length || 
                       recordingDuration || 0;

    return {
      id: data.id || `transcript_${Date.now()}`,
      title: data.title || data.name || selectedFile?.name.replace(/\.[^/.]+$/, "") || 'Audio Transcript',
      durationSec,
      createdAt: data.created_at || data.timestamp || new Date().toISOString(),
      text: transcriptText,
      tldr,
      keyphrases,
      confidence,
      flags,
      piiMasked: data.pii_masked !== undefined ? data.pii_masked : true
    };
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setTranscript(null);
    setWebhookResponse(null);
    setRecordingDuration(undefined);
  };

  const handleProcess = async () => {
    if (!selectedFile) return;
    await handleProcessRecording(selectedFile);
  };

  const handleSendToCases = () => {
    toast.success("Transcript sent to Similar Cases");
    navigate("/sw/cases");
  };

  const handleAddToNotes = () => {
    toast.success("Transcript added to SOAP notes");
    navigate("/sw/notes");
  };

  return (
    <div className="space-y-8 fade-in">
      <div>
        <h1 className="text-4xl font-bold mb-2">Upload & Analyze</h1>
        <p className="text-muted-foreground text-lg">
          Upload session audio for automatic transcription and analysis
        </p>
      </div>

      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-xl">Audio Upload</CardTitle>
          <CardDescription>
            Select an audio file (WAV, MP3, M4A) to transcribe and analyze
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileDropzone
            onFileSelect={handleFileSelect}
            onProcess={handleProcess}
            isProcessing={isProcessing}
            progress={progress}
            initialFile={selectedFile}
            duration={recordingDuration}
          />
        </CardContent>
      </Card>

      {webhookResponse && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Raw webhook response data available in console for debugging
          </AlertDescription>
        </Alert>
      )}

      {transcript && (
        <div className="grid gap-6 lg:grid-cols-3 fade-in">
          <Card className="lg:col-span-2 card-hover">
            <CardHeader>
              <CardTitle className="text-xl">Transcript</CardTitle>
              <CardDescription>
                {webhookResponse ? 'Auto-detected from webhook response' : 'Automatically generated from audio'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TranscriptViewer text={transcript.text} />
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="text-lg">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {transcript.tldr.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Key Points</h4>
                    <ul className="space-y-2">
                      {transcript.tldr.map((point, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex gap-2">
                          <span className="text-primary">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {transcript.keyphrases.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Key Phrases</h4>
                    <div className="flex flex-wrap gap-2">
                      {transcript.keyphrases.map((phrase, idx) => (
                        <Badge key={`${phrase}-${idx}`} variant="secondary">
                          {phrase}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {transcript.confidence > 0 && (
                  <ConfidenceMeter confidence={transcript.confidence} />
                )}
              </CardContent>
            </Card>

            {transcript.flags.length > 0 && (
              <Card className="card-hover">
                <CardHeader>
                  <CardTitle className="text-lg">Risk Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <RiskFlags flags={transcript.flags} />
                </CardContent>
              </Card>
            )}

            {webhookResponse && (
              <Card className="card-hover">
                <CardHeader>
                  <CardTitle className="text-lg">Additional Data</CardTitle>
                  <CardDescription>Other fields from webhook response</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {Object.entries(webhookResponse).map(([key, value]) => {
                      // Skip already displayed fields
                      if (['transcript', 'text', 'transcription', 'transcript_text', 'content',
                           'summary', 'key_points', 'tldr', 'key_phrases', 'keyphrases', 'keywords',
                           'confidence_score', 'confidence', 'accuracy',
                           'risk_flags', 'flags', 'risk_analysis'].includes(key)) {
                        return null;
                      }
                      
                      return (
                        <div key={key} className="border-b pb-2">
                          <span className="font-medium">{key}: </span>
                          <span className="text-muted-foreground">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="text-lg">Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="pii-mask">Anonymize PII</Label>
                  <Switch
                    id="pii-mask"
                    checked={piiMasked}
                    onCheckedChange={setPiiMasked}
                  />
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <Button
                    onClick={handleSendToCases}
                    variant="outline"
                    className="w-full"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send to Similar Cases
                  </Button>
                  <Button
                    onClick={handleAddToNotes}
                    variant="outline"
                    className="w-full"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Add to SOAP Notes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload;
