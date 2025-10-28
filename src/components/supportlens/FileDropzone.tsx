import { useCallback, useState, useEffect } from 'react';
import { Upload, File, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  onProcess: () => void;
  isProcessing: boolean;
  progress: number;
  accept?: string;
  initialFile?: File | null;
  duration?: number;
}

export const FileDropzone = ({
  onFileSelect,
  onProcess,
  isProcessing,
  progress,
  accept = '.wav,.mp3,.m4a',
  initialFile = null,
  duration
}: FileDropzoneProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(initialFile);

  // Update internal state when initialFile prop changes
  useEffect(() => {
    if (initialFile) {
      setSelectedFile(initialFile);
    }
  }, [initialFile]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleRemove = () => {
    setSelectedFile(null);
  };

  const handleProcess = () => {
    if (selectedFile) {
      onProcess();
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300",
          isDragging ? "border-primary bg-gradient-to-br from-primary/10 to-accent/10 shadow-lg scale-[1.02]" : "border-border hover:border-primary/50 hover:shadow-md",
          selectedFile && "border-success bg-success/5"
        )}
      >
        <input
          type="file"
          id="audio-upload"
          className="hidden"
          accept={accept}
          onChange={handleFileInput}
          disabled={isProcessing}
        />
        
        {!selectedFile ? (
          <label htmlFor="audio-upload" className="cursor-pointer block">
            <div className={cn(
              "w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center transition-transform",
              isDragging && "scale-110"
            )}>
              <Upload className={cn(
                "w-8 h-8 text-primary transition-transform",
                isDragging && "animate-bounce"
              )} />
            </div>
            <h3 className="text-lg font-semibold mb-2">Drop audio file here</h3>
            <p className="text-sm text-muted-foreground mb-4">
              or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Supported formats: WAV, MP3, M4A (max 50MB)
            </p>
          </label>
        ) : (
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
              <File className="w-6 h-6 text-success" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {duration !== undefined 
                  ? `${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, '0')}`
                  : `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
                }
              </p>
            </div>
            {!isProcessing && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRemove}
                aria-label="Remove file"
                className="hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {isProcessing && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-center text-muted-foreground">
            Processing audio... {progress}%
          </p>
        </div>
      )}

      {selectedFile && !isProcessing && (
        <Button onClick={handleProcess} className="w-full group" size="lg">
          Process Audio
          <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
        </Button>
      )}
    </div>
  );
};
