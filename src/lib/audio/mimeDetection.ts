export function preferredAudioMime(): string {
  const candidates = [
    'audio/mp4;codecs=aac', // Safari/iOS - best quality
    'audio/mp4',            // general MP4 container
    'audio/aac',            // AAC elementary stream
    'audio/ogg;codecs=opus',
    'audio/webm;codecs=opus',
    'audio/webm'
  ];
  const MR = (window as any).MediaRecorder;
  return candidates.find(t => MR?.isTypeSupported?.(t)) || '';
}

export function getExtensionForMime(mimeType: string): string {
  if (mimeType.includes('mp4') || mimeType.includes('aac')) return '.m4a';
  if (mimeType.includes('ogg')) return '.ogg';
  if (mimeType.includes('webm')) return '.webm';
  return '.audio';
}
