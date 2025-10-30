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
import { FileText, Send, AlertCircle, Upload as UploadIcon } from "lucide-react";
import { recordingsStore } from "@/lib/recordings/store";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { clientStore, Client } from "@/lib/clients/store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [clients, setClients] = useState<Client[]>([]);

  // Load clients on mount
  useEffect(() => {
    const loadClients = async () => {
      const clientList = await clientStore.listAll();
      setClients(clientList);
    };
    loadClients();
  }, []);

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

      const response = await fetch('https://n8n.birthdaymessaging.space/webhook/f936540f-d473-4f4d-87d5-0bbcb3d05612', {
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
      
      // Save recording to recordings store with client link
      if (file) {
        const audioDuration = recordingDuration || 0;
        await recordingsStore.add({
          name: file.name,
          blob: file,
          duration: audioDuration,
          url: '',
          mime: file.type,
          ext: file.name.split('.').pop(),
          bytes: file.size,
          clientId: selectedClientId || undefined,
        });
      }
      
      // Append analysis results to client's notes
      if (selectedClientId && parsedTranscript) {
        const client = await clientStore.getById(selectedClientId);
        if (client) {
          const analysisEntry = formatAnalysisEntry(parsedTranscript, webhookResult);
          const currentAnalyses = Array.isArray(client.analysisNotes) ? client.analysisNotes : [];
          const updatedAnalysisNotes = [...currentAnalyses, analysisEntry];
          
          await clientStore.update(selectedClientId, {
            analysisNotes: updatedAnalysisNotes
          });
        }
      }
      
      toast.success("Audio processed and saved successfully!");
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
    // Check if data is nested under "output"
    const responseData = data.output || data;

    // Extract transcript text
    const transcriptText = responseData.transcript || responseData.text || 
                          responseData.transcription || responseData.transcript_text || 
                          JSON.stringify(data, null, 2);

    // Extract summary/key points from summary_notes or key_topics
    const tldr = responseData.summary_notes ? 
                 [responseData.summary_notes] :
                 responseData.key_topics ?
                 (Array.isArray(responseData.key_topics) ? responseData.key_topics : [responseData.key_topics]) :
                 ['Processing complete'];

    // Extract key phrases from key_topics
    const keyphrases = responseData.key_topics ?
                      (Array.isArray(responseData.key_topics) ? responseData.key_topics : [responseData.key_topics]) :
                      [];

    // Calculate confidence from uncertainty (inverse relationship)
    const confidence = responseData.uncertainty !== undefined ? 
                      (1 - responseData.uncertainty) : 0.85;

    // Extract risk flags from risk_assessment
    const flags: string[] = [];
    if (responseData.risk_assessment) {
      if (responseData.risk_assessment.risk_level && responseData.risk_assessment.risk_level !== 'none') {
        flags.push(responseData.risk_assessment.risk_level);
      }
      if (responseData.risk_assessment.signals && Array.isArray(responseData.risk_assessment.signals)) {
        flags.push(...responseData.risk_assessment.signals.slice(0, 3)); // Take first 3 signals
      }
    }

    // Extract duration
    const durationSec = responseData.duration || responseData.duration_sec || 
                       recordingDuration || 0;

    return {
      id: responseData.id || `transcript_${Date.now()}`,
      title: responseData.title || selectedFile?.name.replace(/\.[^/.]+$/, "") || 'Audio Transcript',
      durationSec,
      createdAt: responseData.created_at || new Date().toISOString(),
      text: transcriptText,
      tldr,
      keyphrases,
      confidence,
      flags,
      piiMasked: true
    };
  };

  // Format analysis results for client notes
  const formatAnalysisEntry = (transcript: Transcript, webhookData: any) => {
    const output = webhookData?.output || webhookData;
    
    return {
      id: crypto.randomUUID(),
      title: transcript.title,
      date: new Date().toISOString(),
      duration: transcript.durationSec,
      riskAssessment: output?.risk_assessment ? {
        level: output.risk_assessment.risk_level || 'Unknown',
        signals: output.risk_assessment.signals || []
      } : undefined,
      summary: transcript.tldr,
      keyPhrases: transcript.keyphrases,
      speakerAnalysis: output?.speakers ? {
        client: output.speakers.user ? {
          sentiment: output.speakers.user.sentiment || 'N/A',
          topEmotions: output.speakers.user.top_emotions || []
        } : undefined,
        supportWorker: output.speakers.support_worker ? {
          sentiment: output.speakers.support_worker.sentiment || 'N/A',
          supportiveness: output.speakers.support_worker.supportiveness || 0
        } : undefined
      } : undefined,
      confidence: transcript.confidence
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
    <div className="space-y-6 fade-in">
      <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-transparent rounded-2xl p-6 border border-primary/10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <UploadIcon className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold">Upload & Analyze</h1>
        </div>
        <p className="text-foreground/70 text-base ml-13">
          Upload session audio for automatic transcription and analysis
        </p>
      </div>

      <Card className="card-hover border-l-4 border-l-primary bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <UploadIcon className="w-4 h-4 text-primary" />
            </div>
            Audio Upload
          </CardTitle>
          <CardDescription>
            Select an audio file (WAV, MP3, M4A) to transcribe and analyze
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="client-select" className="mb-2 block">
              Select Client (Optional)
            </Label>
            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
              <SelectTrigger id="client-select">
                <SelectValue placeholder="No client selected" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
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
        <div className="space-y-6 fade-in">
          {/* Key Metrics Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            {transcript.confidence > 0 && (
              <Card className="card-hover border-l-4 border-l-accent bg-gradient-to-br from-accent/5 to-transparent">
                <CardContent className="pt-6">
                  <ConfidenceMeter confidence={transcript.confidence} />
                </CardContent>
              </Card>
            )}
            
            {(() => {
              const output = webhookResponse?.output || webhookResponse;
              if (output?.risk_assessment) {
                return (
                  <Card className="card-hover">
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Risk Level</p>
                        <Badge variant={
                          output.risk_assessment.risk_level === 'imminent' || output.risk_assessment.risk_level === 'high' ? 'destructive' :
                          output.risk_assessment.risk_level === 'moderate' ? 'outline' :
                          'default'
                        } className="text-base">
                          {output.risk_assessment.risk_level}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              }
              return null;
            })()}

            {(() => {
              const output = webhookResponse?.output || webhookResponse;
              if (output?.speakers?.user) {
                return (
                  <Card className="card-hover">
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Client Sentiment</p>
                        <Badge variant="outline" className="text-base">
                          {output.speakers.user.sentiment}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              }
              return null;
            })()}

            {(() => {
              const output = webhookResponse?.output || webhookResponse;
              if (output?.speakers?.support_worker) {
                return (
                  <Card className="card-hover">
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Supportiveness</p>
                        <div className="text-2xl font-bold">
                          {(output.speakers.support_worker.supportiveness * 100).toFixed(0)}%
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              }
              return null;
            })()}
          </div>

          {/* Main Content: Transcript and Summary */}
          <div className="grid gap-6 lg:grid-cols-3">
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
                  <div className="pt-4 border-t">
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

                {transcript.flags.length > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">Risk Flags</h4>
                    <RiskFlags flags={transcript.flags} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Analysis Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Speaker Analysis */}
            {(() => {
              const output = webhookResponse?.output || webhookResponse;
              if (!output?.speakers) return null;
              
              return (
                <Card className="card-hover">
                  <CardHeader>
                    <CardTitle className="text-lg">Speaker Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {output.speakers.user && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Client</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Sentiment:</span>
                            <Badge variant="outline">{output.speakers.user.sentiment}</Badge>
                          </div>
                          {output.speakers.user.top_emotions && (
                            <div>
                              <span className="text-muted-foreground">Top Emotions:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {output.speakers.user.top_emotions.map((emotion: string, idx: number) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {emotion}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {output.speakers.support_worker && (
                      <div className="pt-3 border-t">
                        <h4 className="text-sm font-medium mb-2">Support Worker</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Sentiment:</span>
                            <Badge variant="outline">{output.speakers.support_worker.sentiment}</Badge>
                          </div>
                          {output.speakers.support_worker.top_emotions && (
                            <div>
                              <span className="text-muted-foreground">Top Emotions:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {output.speakers.support_worker.top_emotions.map((emotion: string, idx: number) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {emotion}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })()}

            {/* Risk Assessment Details */}
            {(() => {
              const output = webhookResponse?.output || webhookResponse;
              if (!output?.risk_assessment) return null;
              
              return (
                <Card className="card-hover">
                  <CardHeader>
                    <CardTitle className="text-lg">Risk Assessment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {output.risk_assessment.signals && output.risk_assessment.signals.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Warning Signals</h4>
                        <ul className="space-y-1">
                          {output.risk_assessment.signals.map((signal: string, idx: number) => (
                            <li key={idx} className="text-sm text-muted-foreground flex gap-2">
                              <span className="text-destructive">•</span>
                              <span>{signal}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {output.risk_assessment.recommended_action && (
                      <div className="pt-3 border-t">
                        <h4 className="text-sm font-medium mb-2">Recommended Action</h4>
                        <p className="text-sm text-muted-foreground">
                          {output.risk_assessment.recommended_action}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })()}

            {/* Metadata */}
            {(() => {
              const output = webhookResponse?.output || webhookResponse;
              if (!output?.language && !output?.conversation_type && !output?.data_quality) return null;
              
              return (
                <Card className="card-hover">
                  <CardHeader>
                    <CardTitle className="text-lg">Metadata</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {output.language && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Language:</span>
                        <span className="font-medium">{output.language.toUpperCase()}</span>
                      </div>
                    )}
                    {output.conversation_type && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type:</span>
                        <span className="font-medium">{output.conversation_type}</span>
                      </div>
                    )}
                    {output.uncertainty !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Confidence:</span>
                        <span className="font-medium">{((1 - output.uncertainty) * 100).toFixed(0)}%</span>
                      </div>
                    )}
                    {output.data_quality && (
                      <div className="pt-3 border-t">
                        <p className="text-muted-foreground mb-2">Quality Indicators:</p>
                        <div className="flex flex-wrap gap-2">
                          {output.data_quality.low_audio && <Badge variant="destructive">Low Audio</Badge>}
                          {output.data_quality.translation_used && <Badge variant="secondary">Translated</Badge>}
                          {output.data_quality.missing_timestamps && <Badge variant="outline">No Timestamps</Badge>}
                          {output.data_quality.partial_transcript && <Badge variant="destructive">Partial</Badge>}
                          {!output.data_quality.low_audio && !output.data_quality.translation_used && 
                           !output.data_quality.missing_timestamps && !output.data_quality.partial_transcript && (
                            <Badge variant="default">Good Quality</Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })()}
          </div>

          {/* Evidence Quotes - Full Width */}
          {(() => {
            const output = webhookResponse?.output || webhookResponse;
            if (!output?.evidence || !Array.isArray(output.evidence) || output.evidence.length === 0) return null;
            
            return (
              <Card className="card-hover">
                <CardHeader>
                  <CardTitle className="text-lg">Key Evidence</CardTitle>
                  <CardDescription>Notable quotes from conversation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {output.evidence.map((item: any, idx: number) => (
                      <div key={idx} className="border-l-2 border-primary pl-4 py-2">
                        <p className="text-sm italic text-muted-foreground mb-2">"{item.quote}"</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{item.speaker}</Badge>
                          {item.timestamp_range && item.timestamp_range !== 'N/A' && (
                            <span className="text-xs text-muted-foreground">{item.timestamp_range}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* Actions */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
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

              <div className="grid gap-3 sm:grid-cols-2 pt-4 border-t">
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
      )}
    </div>
  );
};

export default Upload;
