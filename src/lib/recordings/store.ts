export interface Recording {
  id: string;
  name: string;
  blob: Blob;
  duration: number;
  createdAt: string;
  url: string;
}

const STORAGE_KEY = 'supportlens_recordings';

export const recordingsStore = {
  getAll(): Recording[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  add(recording: Omit<Recording, 'id' | 'createdAt'>): Recording {
    const newRecording: Recording = {
      ...recording,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    
    const recordings = this.getAll();
    recordings.unshift(newRecording);
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recordings));
    } catch (e) {
      console.error('Failed to save recording:', e);
    }
    
    return newRecording;
  },

  remove(id: string): void {
    const recordings = this.getAll().filter(r => r.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recordings));
    } catch (e) {
      console.error('Failed to remove recording:', e);
    }
  },

  get(id: string): Recording | undefined {
    return this.getAll().find(r => r.id === id);
  }
};
