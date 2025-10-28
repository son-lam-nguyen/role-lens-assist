import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Mic, Square, Pause, Play, Download } from "lucide-react";
import { toast } from "sonner";
import { recordingsStore } from "@/lib/recordings/store";
import { useNavigate } from "react-router-dom";
import { blobToWav, decodeToPCM, pcmToWav } from "@/lib/audio/wav";
import { getPreferredEngine, createPcmCapture, type Engine, type PCMCapture } from "@/lib/audio/recorderEngine";

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
  const [exportFormat, setExportFormat] = useState<'wav' | 'mp3' | 'ogg'>('wav');
  const [isConverting, setIsConverting] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const mp3WorkerRef = useRef<Worker | null>(null);
  const navigate = useNavigate();

  const engineRef = useRef<Engine>('mediarecorder-opus');
  const pcmCaptureRef = useRef<PCMCapture | null>(null);
  const capturedPCMRef = useRef<Float32Array | null>(null);
  const capturedSampleRateRef = useRef<number | null>(null);

  useEffect(() => {
    // Initialize MP3 worker
    mp3WorkerRef.current = new Worker(new URL('@/workers/mp3.worker.ts', import.meta.url), { type: 'module' });

    // Detect preferred capture engine for faster exports
    getPreferredEngine().then((engine) => {
      engineRef.current = engine;
    }).catch(() => {
      engineRef.current = 'mediarecorder-opus';
    });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mp3WorkerRef.current) mp3WorkerRef.current.terminate();
      pcmCaptureRef.current?.dispose();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
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

  const saveRecording = () => {
    if (!recordedBlob) return;

    const name = recordingName.trim() || `Recording ${new Date().toLocaleString()}`;
    const url = URL.createObjectURL(recordedBlob);
    
    const recording = recordingsStore.add({
      name,
      blob: recordedBlob,
      duration: recordingTime,
      url,
    });

    toast.success("Recording saved!", {
      action: {
        label: "Use in Upload & Analyze",
        onClick: () => {
          navigate(`/sw/upload?recordingId=${recording.id}`);
          onOpenChange(false);
        }
      }
    });

    resetRecorder();
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
      } else if (exportFormat === 'mp3') {
        toast.loading("Converting to MP3...");
        if (capturedPCMRef.current && capturedSampleRateRef.current) {
          const mp3Blob = await encodeMp3InWorker(capturedPCMRef.current, capturedSampleRateRef.current);
          downloadBlob(mp3Blob, `${filename}.mp3`);
        } else {
          const { pcm, sampleRate } = await decodeToPCM(recordedBlob);
          const mp3Blob = await encodeMp3InWorker(pcm, sampleRate);
          downloadBlob(mp3Blob, `${filename}.mp3`);
        }
        toast.dismiss();
        toast.success("Recording downloaded as MP3");
      } else {
        // OGG/Opus - original format
        downloadBlob(recordedBlob, `${filename}.ogg`);
        toast.success("Recording downloaded as OGG");
      }
    } catch (error) {
      console.error('Conversion failed:', error);
      toast.dismiss();
      toast.error("Failed to convert recording. Downloading as WebM instead.");
      downloadBlob(recordedBlob, `${filename}.webm`);
    } finally {
      setIsConverting(false);
    }
  };

  const encodeMp3InWorker = (pcm: Float32Array, sampleRate: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!mp3WorkerRef.current) {
        reject(new Error('MP3 worker not initialized'));
        return;
      }

      const worker = mp3WorkerRef.current;

      worker.onmessage = (e: MessageEvent) => {
        if (e.data.success) {
          const blob = new Blob([e.data.data], { type: 'audio/mpeg' });
          resolve(blob);
        } else {
          reject(new Error(e.data.error));
        }
      };

      worker.onerror = (error) => {
        reject(error);
      };

      worker.postMessage({ pcm, sampleRate }, [pcm.buffer]);
    });
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
                  <RadioGroup value={exportFormat} onValueChange={(v) => setExportFormat(v as 'wav' | 'mp3' | 'ogg')}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="wav" id="wav" />
                      <Label htmlFor="wav" className="font-normal cursor-pointer">
                        WAV (fast, larger)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="mp3" id="mp3" />
                      <Label htmlFor="mp3" className="font-normal cursor-pointer">
                        MP3 (smaller, slower)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="ogg" id="ogg" />
                      <Label htmlFor="ogg" className="font-normal cursor-pointer">
                        OGG (original)
                      </Label>
                    </div>
                  </RadioGroup>
                  <p className="text-xs text-muted-foreground">
                    WAV saves instantly; MP3 may take a few seconds.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={saveRecording}
                    size="lg"
                    className="flex-1"
                  >
                    Save
                  </Button>
                  <Button
                    onClick={downloadRecording}
                    variant="outline"
                    size="lg"
                    className="flex-1"
                    disabled={isConverting}
                  >
                    <Download className="w-5 h-5 mr-2" />
                    {isConverting ? "Converting..." : `Download ${exportFormat.toUpperCase()}`}
                  </Button>
                </div>

                <Button
                  onClick={resetRecorder}
                  variant="ghost"
                  size="sm"
                  className="w-full"
                >
                  Record Again
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
