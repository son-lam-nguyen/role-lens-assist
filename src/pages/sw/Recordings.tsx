import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RecorderModal } from "@/components/recorder/RecorderModal";
import { recordingsStore, Recording } from "@/lib/recordings/store";
import { getExtensionForMime, mapMimeToExt } from "@/lib/audio/mimeDetection";
import { AudioLines, Play, Download, Upload, Trash2, Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const Recordings = () => {
  const navigate = useNavigate();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRecorderOpen, setIsRecorderOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [selectedRecordings, setSelectedRecordings] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  const loadRecordings = async () => {
    const stored = await recordingsStore.getAll();
    setRecordings(stored);
  };

  useEffect(() => {
    loadRecordings();
  }, []);

  useEffect(() => {
    if (!isRecorderOpen) {
      loadRecordings();
    }
  }, [isRecorderOpen]);

  const filteredRecordings = recordings.filter((rec) =>
    rec.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePlay = (recording: Recording) => {
    if (playingId === recording.id) {
      setPlayingId(null);
    } else {
      setPlayingId(recording.id);
    }
  };

  const handleDownload = async (recording: Recording) => {
    try {
      const response = await fetch(recording.url);
      const blob = await response.blob();
      const ext = recording.ext || mapMimeToExt(recording.mime || blob.type);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${recording.name}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Recording downloaded");
    } catch (e) {
      toast.error('Failed to download recording');
      console.error(e);
    }
  };

  const handleUseInUpload = (recordingId: string) => {
    navigate(`/sw/upload?from=recordings&id=${recordingId}`);
    toast.success("Recording ready for analysis");
  };

  const handleDeleteConfirm = async () => {
    if (deleteTarget) {
      await recordingsStore.remove(deleteTarget);
      loadRecordings();
      setDeleteTarget(null);
      toast.success("Recording deleted");
    }
  };

  const handleSelectAll = () => {
    if (selectedRecordings.size === filteredRecordings.length) {
      setSelectedRecordings(new Set());
    } else {
      setSelectedRecordings(new Set(filteredRecordings.map(r => r.id)));
    }
  };

  const handleSelectRecording = (id: string) => {
    const newSelected = new Set(selectedRecordings);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRecordings(newSelected);
  };

  const handleBulkDelete = () => {
    setBulkDeleteDialogOpen(true);
  };

  const handleBulkDeleteConfirm = async () => {
    for (const id of selectedRecordings) {
      await recordingsStore.remove(id);
    }
    loadRecordings();
    setSelectedRecordings(new Set());
    setBulkDeleteDialogOpen(false);
    toast.success(`${selectedRecordings.size} recording(s) deleted`);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes?: number): string => {
    if (typeof bytes !== 'number' || isNaN(bytes)) return '—';
    if (bytes < 1048576) {
      return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    }
    return `${(bytes / 1048576).toFixed(2)} MB`;
  };

  const getFormatLabel = (recording: Recording): string => {
    if (recording.ext) return recording.ext.toUpperCase();
    if (recording.mime) return mapMimeToExt(recording.mime).toUpperCase();
    // Fallback to blob-based detection
    const mimeType = recording.blob?.type || 'audio/webm';
    if (mimeType.includes('mp4') || mimeType.includes('aac')) return 'M4A';
    if (mimeType.includes('wav')) return 'WAV';
    if (mimeType.includes('ogg')) return 'OGG';
    if (mimeType.includes('webm')) return 'WEBM';
    return 'AUDIO';
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="bg-gradient-to-r from-teal-600/5 via-primary/5 to-transparent rounded-2xl p-6 border border-teal-600/10">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center">
                <AudioLines className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold">Audio Recorded</h1>
            </div>
            <p className="text-foreground/70 text-base ml-13">
              Manage your saved audio recordings
            </p>
          </div>
          <Button onClick={() => setIsRecorderOpen(true)} size="lg">
            <AudioLines className="w-5 h-5 mr-2" />
            Record New
          </Button>
        </div>
      </div>

      <Card className="card-hover border-l-4 border-l-teal-600 bg-gradient-to-br from-teal-600/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-600/10 flex items-center justify-center">
                  <AudioLines className="w-4 h-4 text-teal-600" />
                </div>
                Saved Recordings
              </CardTitle>
              <CardDescription>
                {recordings.length} recording{recordings.length !== 1 ? 's' : ''} saved
                {selectedRecordings.size > 0 && ` • ${selectedRecordings.size} selected`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {selectedRecordings.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected ({selectedRecordings.size})
                </Button>
              )}
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search recordings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRecordings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AudioLines className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchQuery ? "No recordings found" : "No recordings yet"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "Record your first audio session to get started"}
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsRecorderOpen(true)}>
                  <AudioLines className="w-4 h-4 mr-2" />
                  Record New
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedRecordings.size === filteredRecordings.length && filteredRecordings.length > 0}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Format / Size</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecordings.map((recording) => (
                    <TableRow key={recording.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedRecordings.has(recording.id)}
                          onCheckedChange={() => handleSelectRecording(recording.id)}
                          aria-label={`Select ${recording.name}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {recording.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(recording.createdAt).toLocaleDateString()} at{" "}
                        {new Date(recording.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{getFormatLabel(recording)}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatFileSize(recording.bytes)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePlay(recording)}
                            aria-label="Play recording"
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(recording)}
                            aria-label="Download recording"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUseInUpload(recording.id)}
                            aria-label="Use in Upload & Analyze"
                          >
                            <Upload className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(recording.id)}
                            aria-label="Delete recording"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {playingId && (
            <div className="mt-4 p-4 border rounded-lg bg-muted/50">
              <p className="text-sm font-medium mb-2">Now Playing</p>
              <audio
                controls
                autoPlay
                className="w-full"
                src={recordings.find((r) => r.id === playingId)?.url}
                onEnded={() => setPlayingId(null)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <RecorderModal open={isRecorderOpen} onOpenChange={setIsRecorderOpen} />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recording</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this recording? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Recordings</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedRecordings.size} recording(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Recordings;
