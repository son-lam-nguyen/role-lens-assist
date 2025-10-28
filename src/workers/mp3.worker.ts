/// <reference lib="webworker" />

import * as lamejs from 'lamejs';

self.onmessage = (e: MessageEvent) => {
  const { pcm, sampleRate } = e.data;
  
  try {
    // Convert Float32Array to Int16Array (lamejs expects 16-bit PCM)
    const samples = new Int16Array(pcm.length);
    for (let i = 0; i < pcm.length; i++) {
      const s = Math.max(-1, Math.min(1, pcm[i]));
      samples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    // Initialize MP3 encoder (mono, 128kbps)
    // @ts-ignore - lamejs types are not perfect
    const mp3encoder = new lamejs.Mp3Encoder(1, sampleRate, 128);
    const mp3Data: Int8Array[] = [];
    
    // Encode in chunks
    const chunkSize = 1152; // Standard MP3 frame size
    for (let i = 0; i < samples.length; i += chunkSize) {
      const chunk = samples.subarray(i, i + chunkSize);
      const mp3buf = mp3encoder.encodeBuffer(chunk);
      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
      }
    }
    
    // Flush remaining data
    const mp3buf = mp3encoder.flush();
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }
    
    // Combine all chunks
    const totalLength = mp3Data.reduce((acc, arr) => acc + arr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of mp3Data) {
      result.set(arr, offset);
      offset += arr.length;
    }
    
    self.postMessage({ success: true, data: result.buffer }, [result.buffer]);
  } catch (error) {
    self.postMessage({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
};
