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

export function supportsM4A(): boolean {
  const candidates = ['audio/mp4;codecs=aac', 'audio/mp4', 'audio/aac'];
  const MR = (window as any).MediaRecorder;
  return !!candidates.find(t => MR?.isTypeSupported?.(t));
}

export function mapMimeToExt(mime: string): 'm4a' | 'wav' | 'ogg' | 'webm' | 'bin' {
  if (!mime) return 'bin';
  if (mime.includes('audio/mp4') || mime.includes('audio/aac')) return 'm4a';
  if (mime.includes('wav')) return 'wav';
  if (mime.includes('ogg')) return 'ogg';
  if (mime.includes('webm')) return 'webm';
  return 'bin';
}
