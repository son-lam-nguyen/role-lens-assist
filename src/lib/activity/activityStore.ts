export interface ActivityLog {
  id: string;
  type: 'client_add' | 'client_edit' | 'client_delete' | 'audio_upload' | 'recording_saved' | 'process_audio' | 'soap_create' | 'soap_export' | 'calendar_add' | 'calendar_edit' | 'calendar_delete' | 'message_sent' | 'chat_closed';
  title: string;
  meta?: Record<string, any>;
  timestamp: number;
}

const ACTIVITY_LOG_KEY = 'supportlens_activity_log';
const MAX_ACTIVITIES = 100; // Keep last 100 activities

export const activityStore = {
  log(type: ActivityLog['type'], title: string, meta?: Record<string, any>) {
    const activities = this.getAll();
    const newActivity: ActivityLog = {
      id: crypto.randomUUID(),
      type,
      title,
      meta,
      timestamp: Date.now()
    };
    
    activities.unshift(newActivity);
    
    // Keep only the last MAX_ACTIVITIES
    if (activities.length > MAX_ACTIVITIES) {
      activities.splice(MAX_ACTIVITIES);
    }
    
    localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(activities));
  },

  getAll(): ActivityLog[] {
    const stored = localStorage.getItem(ACTIVITY_LOG_KEY);
    if (!stored) return [];
    
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  },

  getRecent(limit: number = 10): ActivityLog[] {
    return this.getAll().slice(0, limit);
  },

  clear() {
    localStorage.removeItem(ACTIVITY_LOG_KEY);
  }
};
