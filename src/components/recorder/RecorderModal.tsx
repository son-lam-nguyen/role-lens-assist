import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Mic, Square, Pause, Play, Download, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { recordingsStore } from "@/lib/recordings/store";
import { useNavigate } from "react-router-dom";
import { blobToWav, pcmToWav } from "@/lib/audio/wav";
import { getPreferredEngine, createPcmCapture, type Engine, type PCMCapture } from "@/lib/audio/recorderEngine";
import { preferredAudioMime, getExtensionForMime, supportsM4A, mapMimeToExt } from "@/lib/audio/mimeDetection";

interface RecorderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RecorderModal = ({ open, onOpenChange }: RecorderModalProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingName, setRecordingName] = useState("");
  const [exportFormat, setExportFormat] = useState<'m4a' | 'wav' | 'original'>('m4a');
  const [isConverting, setIsConverting] = useState(false);
  const [recordedMimeType, setRecordedMimeType] = useState<string>('');
  const [m4aSupported, setM4aSupported] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const navigate = useNavigate();

  const engineRef = useRef<Engine>('mediarecorder-opus');
  const pcmCaptureRef = useRef<PCMCapture | null>(null);
  const capturedPCMRef = useRef<Float32Array | null>(null);
  const capturedSampleRateRef = useRef<number | null>(null);

  useEffect(() => {
    // Detect preferred capture engine for faster exports
    getPreferredEngine().then((engine) => {
      engineRef.current = engine;
    }).catch(() => {
      engineRef.current = 'mediarecorder-opus';
    });

    // Check M4A support
    setM4aSupported(supportsM4A());

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      pcmCaptureRef.current?.dispose();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = preferredAudioMime();
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      setRecordedMimeType(mimeType);
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
        setRecordedBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);

      // Start optional PCM capture for instant WAV/MP3 export
      try {
        if (engineRef.current === 'pcm-wav') {
          pcmCaptureRef.current = createPcmCapture();
          await pcmCaptureRef.current.start(stream);
          capturedPCMRef.current = null;
          capturedSampleRateRef.current = null;
        }
      } catch (e) {
        console.warn('PCM capture unavailable, falling back to decode path', e);
      }
      
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast.success("Recording started");
    } catch (error) {
      toast.error("Failed to access microphone");
      console.error(error);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = window.setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
        setIsPaused(false);
        toast.success("Recording resumed");
      } else {
        mediaRecorderRef.current.pause();
        if (timerRef.current) clearInterval(timerRef.current);
        setIsPaused(true);
        toast.success("Recording paused");
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();

      // Finalize PCM capture if running
      if (pcmCaptureRef.current) {
        try {
          const { pcm, sampleRate } = pcmCaptureRef.current.stop();
          capturedPCMRef.current = pcm;
          capturedSampleRateRef.current = sampleRate;
        } catch (e) {
          console.warn('Failed to finalize PCM capture', e);
        } finally {
          pcmCaptureRef.current = null;
        }
      }

      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      toast.success("Recording stopped");
    }
  };

  const saveRecording = async () => {
    if (!recordedBlob) return;

    const name = recordingName.trim() || `Recording ${new Date().toLocaleString()}`;

    try {
      setIsConverting(true);
      let blobToSave = recordedBlob;
      let mimeType = recordedMimeType;

      // Convert based on export format
      if (exportFormat === 'wav') {
        if (capturedPCMRef.current && capturedSampleRateRef.current) {
          blobToSave = pcmToWav(capturedPCMRef.current, capturedSampleRateRef.current, 1);
        } else {
          toast.loading("Converting to WAV...");
          blobToSave = await blobToWav(recordedBlob);
          toast.dismiss();
        }
        mimeType = 'audio/wav';
      } else if (exportFormat === 'm4a') {
        // Only use M4A if natively recorded as M4A
        const ext = getExtensionForMime(recordedMimeType);
        if (ext !== '.m4a') {
          blobToSave = recordedBlob; // Fallback to original
          mimeType = recordedMimeType;
        }
      }
      // 'original' uses recordedBlob as-is

      const url = URL.createObjectURL(blobToSave);
      const recording = recordingsStore.add({
        name,
        blob: blobToSave,
        duration: recordingTime,
        url,
      });

      toast.success("Recording saved!", {
        action: {
          label: "Use in Upload & Analyze",
          onClick: () => {
            navigate(`/sw/upload?from=recordings&id=${recording.id}`);
            onOpenChange(false);
          }
        }
      });

      resetRecorder();
    } catch (error) {
      console.error('Save failed:', error);
      toast.dismiss();
      toast.error("Failed to save recording.");
    } finally {
      setIsConverting(false);
    }
  };

  const handleAnalyze = () => {
    if (!recordedBlob) {
      toast.error("No recording available");
      return;
    }

    const name = recordingName.trim() || `Recording ${new Date().toLocaleString()}`;
    const url = URL.createObjectURL(recordedBlob);
    
    const recording = recordingsStore.add({
      name,
      blob: recordedBlob,
      duration: recordingTime,
      url,
    });

    toast.success(`Loaded recording: ${name} — analyzing…`);
    navigate(`/sw/upload?from=recorder&id=${recording.id}`);
    onOpenChange(false);
  };

  const downloadRecording = async () => {
    if (!recordedBlob) return;

    const filename = recordingName.trim() || 'recording';

    try {
      setIsConverting(true);

      if (exportFormat === 'wav') {
        // Fast path: if we captured PCM, wrap directly into WAV
        if (capturedPCMRef.current && capturedSampleRateRef.current) {
          const wavBlob = pcmToWav(capturedPCMRef.current, capturedSampleRateRef.current, 1);
          downloadBlob(wavBlob, `${filename}.wav`);
          toast.success("Recording downloaded as WAV");
        } else {
          toast.loading("Converting to WAV...");
          const wavBlob = await blobToWav(recordedBlob);
          toast.dismiss();
          downloadBlob(wavBlob, `${filename}.wav`);
          toast.success("Recording downloaded as WAV");
        }
      } else if (exportFormat === 'm4a') {
        // M4A - native recording (if supported) or original
        const ext = getExtensionForMime(recordedMimeType);
        if (ext === '.m4a') {
          downloadBlob(recordedBlob, `${filename}.m4a`);
          toast.success("Recording downloaded as M4A");
        } else {
          // Fallback to original format
          downloadBlob(recordedBlob, `${filename}${ext}`);
          toast.success("Recording downloaded");
        }
      } else {
        // Original format
        const ext = getExtensionForMime(recordedMimeType);
        downloadBlob(recordedBlob, `${filename}${ext}`);
        toast.success("Recording downloaded");
      }
    } catch (error) {
      console.error('Download failed:', error);
      toast.dismiss();
      toast.error("Failed to download recording.");
    } finally {
      setIsConverting(false);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetRecorder = () => {
    setRecordingTime(0);
    setRecordedBlob(null);
    setRecordingName("");
    chunksRef.current = [];
    capturedPCMRef.current = null;
    capturedSampleRateRef.current = null;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Audio Recorder</DialogTitle>
          <DialogDescription>
            Record audio for your support session
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex flex-col items-center gap-4">
            <div className="text-4xl font-mono font-bold">
              {formatTime(recordingTime)}
            </div>

            {!isRecording && !recordedBlob && (
              <Button
                onClick={startRecording}
                size="lg"
                className="w-full"
              >
                <Mic className="w-5 h-5 mr-2" />
                Start Recording
              </Button>
            )}

            {isRecording && (
              <div className="flex gap-2 w-full">
                <Button
                  onClick={pauseRecording}
                  variant="outline"
                  size="lg"
                  className="flex-1"
                >
                  {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                </Button>
                <Button
                  onClick={stopRecording}
                  variant="destructive"
                  size="lg"
                  className="flex-1"
                >
                  <Square className="w-5 h-5 mr-2" />
                  Stop
                </Button>
              </div>
            )}

            {recordedBlob && (
              <div className="w-full space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Recording Name</label>
                  <Input
                    value={recordingName}
                    onChange={(e) => setRecordingName(e.target.value)}
                    placeholder="Enter recording name..."
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Export Format</Label>
                  <RadioGroup value={exportFormat} onValueChange={(v) => setExportFormat(v as 'm4a' | 'wav' | 'original')}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="m4a" id="m4a" disabled={!m4aSupported} />
                      <Label htmlFor="m4a" className={`font-normal ${m4aSupported ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                        M4A (native, best quality) {!m4aSupported && '(not supported)'}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="wav" id="wav" />
                      <Label htmlFor="wav" className="font-normal cursor-pointer">
                        WAV (fast, larger)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="original" id="original" />
                      <Label htmlFor="original" className="font-normal cursor-pointer">
                        Original (as recorded)
                      </Label>
                    </div>
                  </RadioGroup>
                  <p className="text-xs text-muted-foreground">
                    {m4aSupported ? 'M4A and WAV are fast; no conversion delay.' : 'WAV is fast; no conversion delay.'}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={saveRecording}
                    size="lg"
                    className="flex-1"
                    disabled={isConverting}
                  >
                    {isConverting ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    onClick={downloadRecording}
                    variant="outline"
                    size="lg"
                    className="flex-1"
                    disabled={isConverting}
                  >
                    <Download className="w-5 h-5 mr-2" />
                    {isConverting ? "Converting..." : "Download"}
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleAnalyze}
                    size="lg"
                    className="flex-1"
                    disabled={isConverting}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analyze
                  </Button>
                  <Button
                    onClick={resetRecorder}
                    variant="ghost"
                    size="lg"
                    className="flex-1"
                  >
                    Record Again
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
