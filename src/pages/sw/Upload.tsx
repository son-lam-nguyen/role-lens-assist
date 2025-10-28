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
import { FileText, Send } from "lucide-react";
import { recordingsStore } from "@/lib/recordings/store";

const Upload = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [transcript, setTranscript] = useState<Transcript | null>(null);
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
      
      const result = await processAudioMock(file);
      setProgress(100);
      setTranscript(result);
      toast.success("Audio sent to webhook and processed successfully!");
    } catch (error) {
      console.error('Webhook error:', error);
      toast.error("Failed to process audio");
    } finally {
      setIsProcessing(false);
      clearInterval(progressInterval);
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setTranscript(null);
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

      {transcript && (
        <div className="grid gap-6 lg:grid-cols-3 fade-in">
          <Card className="lg:col-span-2 card-hover">
            <CardHeader>
              <CardTitle className="text-xl">Transcript</CardTitle>
              <CardDescription>
                Automatically generated from audio with PII masking
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

                <div>
                  <h4 className="text-sm font-medium mb-2">Key Phrases</h4>
                  <div className="flex flex-wrap gap-2">
                    {transcript.keyphrases.map((phrase) => (
                      <Badge key={phrase} variant="secondary">
                        {phrase}
                      </Badge>
                    ))}
                  </div>
                </div>

                <ConfidenceMeter confidence={transcript.confidence} />
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="text-lg">Risk Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <RiskFlags flags={transcript.flags} />
              </CardContent>
            </Card>

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
