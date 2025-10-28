export type Engine = 'pcm-wav' | 'mediarecorder-opus';

export async function getPreferredEngine(): Promise<Engine> {
  try {
    const hasAudioContext = typeof window !== 'undefined' && (typeof (window as any).AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined');
    const hasWorklet = typeof window !== 'undefined' && 'AudioWorkletNode' in window;
    return hasAudioContext && hasWorklet ? 'pcm-wav' : 'mediarecorder-opus';
  } catch {
    return 'mediarecorder-opus';
  }
}

export interface PCMCapture {
  start(stream: MediaStream): Promise<void>;
  stop(): { pcm: Float32Array; sampleRate: number };
  dispose(): void;
}

export function createPcmCapture(): PCMCapture {
  let audioContext: AudioContext | null = null;
  let source: MediaStreamAudioSourceNode | null = null;
  let processor: ScriptProcessorNode | null = null;
  let sink: GainNode | null = null;
  let buffers: Float32Array[] = [];
  let sampleRate = 44100;

  return {
    async start(stream: MediaStream) {
      const AC: typeof AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AC) throw new Error('AudioContext not supported');
      audioContext = new AC();
      sampleRate = audioContext.sampleRate;

      source = audioContext.createMediaStreamSource(stream);
      const bufferSize = 4096; // good tradeoff for CPU vs latency
      processor = audioContext.createScriptProcessor(bufferSize, 1, 1);
      sink = audioContext.createGain();
      sink.gain.value = 0; // mute processing chain

      processor.onaudioprocess = (e: AudioProcessingEvent) => {
        const input = e.inputBuffer.getChannelData(0);
        // copy the chunk to avoid retaining the internal buffer
        buffers.push(new Float32Array(input));
      };

      source.connect(processor);
      processor.connect(sink);
      sink.connect(audioContext.destination);

      await audioContext.resume();
    },
    stop() {
      if (!audioContext || !processor) throw new Error('PCM capture not started');
      try {
        processor.disconnect();
        source?.disconnect();
        sink?.disconnect();
      } catch {}

      const totalLength = buffers.reduce((acc, b) => acc + b.length, 0);
      const pcm = new Float32Array(totalLength);
      let offset = 0;
      for (const b of buffers) {
        pcm.set(b, offset);
        offset += b.length;
      }

      // Cleanup
      audioContext.close();
      audioContext = null;
      source = null;
      processor = null;
      sink = null;
      buffers = [];

      return { pcm, sampleRate };
    },
    dispose() {
      try {
        processor?.disconnect();
        source?.disconnect();
        sink?.disconnect();
        audioContext?.close();
      } catch {}
      audioContext = null;
      source = null;
      processor = null;
      sink = null;
      buffers = [];
    }
  };
}
