/**
 * Convert WebM/Opus Blob to WAV format using Web Audio API
 */
export async function blobToWav(blob: Blob): Promise<Blob> {
  // Read blob as ArrayBuffer
  const arrayBuffer = await blob.arrayBuffer();
  
  // Decode audio data
  const audioContext = new AudioContext();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
  // Convert to WAV
  const wav = audioBufferToWav(audioBuffer);
  
  return new Blob([wav], { type: 'audio/wav' });
}

/**
 * Convert AudioBuffer to WAV ArrayBuffer
 */
function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  
  // Interleave channels
  const length = buffer.length * numChannels * 2;
  const result = new ArrayBuffer(44 + length);
  const view = new DataView(result);
  const channels: Float32Array[] = [];
  let offset = 0;
  
  for (let i = 0; i < numChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }
  
  // Write WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
  view.setUint16(32, numChannels * (bitDepth / 8), true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, length, true);
  
  // Write PCM samples
  offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, channels[channel][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }
  
  return result;
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Decode Blob to PCM data for MP3 encoding
 */
export async function decodeToPCM(blob: Blob): Promise<{ pcm: Float32Array; sampleRate: number; channels: number }> {
  const arrayBuffer = await blob.arrayBuffer();
  const audioContext = new AudioContext();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
  // Merge channels to mono for simpler MP3 encoding
  const pcm = audioBuffer.numberOfChannels === 1 
    ? audioBuffer.getChannelData(0)
    : mergeChannels(audioBuffer);
  
  return {
    pcm,
    sampleRate: audioBuffer.sampleRate,
    channels: audioBuffer.numberOfChannels
  };
}

function mergeChannels(buffer: AudioBuffer): Float32Array {
  const numChannels = buffer.numberOfChannels;
  const length = buffer.length;
  const result = new Float32Array(length);
  
  for (let i = 0; i < length; i++) {
    let sum = 0;
    for (let channel = 0; channel < numChannels; channel++) {
      sum += buffer.getChannelData(channel)[i];
    }
    result[i] = sum / numChannels;
  }
  
  return result;
}

/**
 * Fast path: Wrap raw mono PCM Float32 into a 16-bit PCM WAV Blob
 */
export function pcmToWav(pcm: Float32Array, sampleRate: number, channels = 1): Blob {
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const dataLength = pcm.length * bytesPerSample * channels; // mono by default
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');

  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // format (PCM)
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * bytesPerSample, true); // byte rate
  view.setUint16(32, channels * bytesPerSample, true); // block align
  view.setUint16(34, bitDepth, true);

  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // PCM samples (mono)
  let offset = 44;
  for (let i = 0; i < pcm.length; i++) {
    const s = Math.max(-1, Math.min(1, pcm[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}
