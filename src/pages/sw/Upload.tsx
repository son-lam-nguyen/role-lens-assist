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
              <>
                {/* Speaker Analysis */}
                {(() => {
                  const output = webhookResponse.output || webhookResponse;
                  if (!output.speakers) return null;
                  
                  return (
                    <Card className="card-hover">
                      <CardHeader>
                        <CardTitle className="text-lg">Speaker Analysis</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {output.speakers.user && (
                          <div>
                            <h4 className="text-sm font-medium mb-2">Client</h4>
                            <div className="space-y-1 text-sm">
                              <p><span className="font-medium">Sentiment:</span> <Badge variant="outline">{output.speakers.user.sentiment}</Badge></p>
                              {output.speakers.user.top_emotions && (
                                <p><span className="font-medium">Top Emotions:</span> {output.speakers.user.top_emotions.join(', ')}</p>
                              )}
                              {output.speakers.user.toxicity !== undefined && (
                                <p><span className="font-medium">Toxicity:</span> {output.speakers.user.toxicity}</p>
                              )}
                            </div>
                          </div>
                        )}
                        {output.speakers.support_worker && (
                          <div className="pt-2 border-t">
                            <h4 className="text-sm font-medium mb-2">Support Worker</h4>
                            <div className="space-y-1 text-sm">
                              <p><span className="font-medium">Sentiment:</span> <Badge variant="outline">{output.speakers.support_worker.sentiment}</Badge></p>
                              {output.speakers.support_worker.top_emotions && (
                                <p><span className="font-medium">Top Emotions:</span> {output.speakers.support_worker.top_emotions.join(', ')}</p>
                              )}
                              {output.speakers.support_worker.supportiveness !== undefined && (
                                <p><span className="font-medium">Supportiveness:</span> {(output.speakers.support_worker.supportiveness * 100).toFixed(0)}%</p>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })()}

                {/* Risk Assessment */}
                {(() => {
                  const output = webhookResponse.output || webhookResponse;
                  if (!output.risk_assessment) return null;
                  
                  return (
                    <Card className="card-hover">
                      <CardHeader>
                        <CardTitle className="text-lg">Risk Assessment</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <span className="text-sm font-medium">Risk Level: </span>
                          <Badge variant={
                            output.risk_assessment.risk_level === 'imminent' || output.risk_assessment.risk_level === 'high' ? 'destructive' :
                            output.risk_assessment.risk_level === 'moderate' ? 'outline' :
                            'default'
                          }>
                            {output.risk_assessment.risk_level}
                          </Badge>
                        </div>
                        {output.risk_assessment.signals && output.risk_assessment.signals.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2">Signals:</h4>
                            <ul className="space-y-1">
                              {output.risk_assessment.signals.map((signal: string, idx: number) => (
                                <li key={idx} className="text-sm text-muted-foreground flex gap-2">
                                  <span className="text-primary">•</span>
                                  <span>{signal}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {output.risk_assessment.recommended_action && (
                          <div className="pt-2 border-t">
                            <p className="text-sm">
                              <span className="font-medium">Recommended Action:</span><br />
                              {output.risk_assessment.recommended_action}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })()}

                {/* Evidence Quotes */}
                {(() => {
                  const output = webhookResponse.output || webhookResponse;
                  if (!output.evidence || !Array.isArray(output.evidence) || output.evidence.length === 0) return null;
                  
                  return (
                    <Card className="card-hover">
                      <CardHeader>
                        <CardTitle className="text-lg">Key Evidence</CardTitle>
                        <CardDescription>Notable quotes from conversation</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {output.evidence.map((item: any, idx: number) => (
                            <div key={idx} className="border-l-2 border-primary pl-3">
                              <p className="text-sm italic text-muted-foreground">"{item.quote}"</p>
                              <p className="text-xs mt-1">
                                <Badge variant="outline" className="mr-2">{item.speaker}</Badge>
                                {item.timestamp_range && item.timestamp_range !== 'N/A' && (
                                  <span className="text-muted-foreground">{item.timestamp_range}</span>
                                )}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}

                {/* Conversation Metadata */}
                {(() => {
                  const output = webhookResponse.output || webhookResponse;
                  if (!output.language && !output.conversation_type && !output.data_quality) return null;
                  
                  return (
                    <Card className="card-hover">
                      <CardHeader>
                        <CardTitle className="text-lg">Metadata</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        {output.language && (
                          <p><span className="font-medium">Language:</span> {output.language.toUpperCase()}</p>
                        )}
                        {output.conversation_type && (
                          <p><span className="font-medium">Type:</span> {output.conversation_type}</p>
                        )}
                        {output.data_quality && (
                          <div className="pt-2 border-t">
                            <p className="font-medium mb-1">Data Quality:</p>
                            <div className="flex flex-wrap gap-2">
                              {output.data_quality.low_audio && <Badge variant="destructive">Low Audio</Badge>}
                              {output.data_quality.translation_used && <Badge variant="secondary">Translation Used</Badge>}
                              {output.data_quality.missing_timestamps && <Badge variant="outline">No Timestamps</Badge>}
                              {output.data_quality.partial_transcript && <Badge variant="destructive">Partial</Badge>}
                              {!output.data_quality.low_audio && !output.data_quality.translation_used && 
                               !output.data_quality.missing_timestamps && !output.data_quality.partial_transcript && (
                                <Badge variant="default">Good Quality</Badge>
                              )}
                            </div>
                          </div>
                        )}
                        {output.uncertainty !== undefined && (
                          <p className="pt-2 border-t">
                            <span className="font-medium">Confidence:</span> {((1 - output.uncertainty) * 100).toFixed(0)}%
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })()}
              </>
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
