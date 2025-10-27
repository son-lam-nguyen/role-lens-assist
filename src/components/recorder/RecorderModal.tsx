import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Square, Pause, Play, Download } from "lucide-react";
import { toast } from "sonner";
import { recordingsStore } from "@/lib/recordings/store";
import { useNavigate } from "react-router-dom";

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
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
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

  const downloadRecording = () => {
    if (!recordedBlob) return;

    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recordingName || 'recording'}.webm`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Recording downloaded");
  };

  const resetRecorder = () => {
    setRecordingTime(0);
    setRecordedBlob(null);
    setRecordingName("");
    chunksRef.current = [];
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
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download
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
