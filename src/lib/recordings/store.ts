import { supabase } from "@/integrations/supabase/client";

export interface Recording {
  id: string;
  name: string;
  blob?: Blob;
  duration: number;
  createdAt: string;
  url: string;
  mime?: string;
  ext?: string;
  bytes?: number;
}

export const recordingsStore = {
  async getAll(): Promise<Recording[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('recordings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching recordings:', error);
      return [];
    }

    return await Promise.all((data || []).map(async (row) => {
      const { data: urlData } = await supabase.storage
        .from('recordings')
        .createSignedUrl(row.storage_path, 3600);

      return {
        id: row.id,
        name: row.name,
        duration: row.duration,
        createdAt: row.created_at,
        url: urlData?.signedUrl || '',
        mime: row.mime_type || undefined,
        ext: row.file_extension || undefined,
        bytes: row.file_size ? Number(row.file_size) : undefined,
      };
    }));
  },

  async add(recording: Omit<Recording, 'id' | 'createdAt'>): Promise<Recording | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('User not authenticated');
      return null;
    }

    if (!recording.blob) {
      console.error('No blob provided for recording');
      return null;
    }

    const fileName = `${user.id}/${Date.now()}_${recording.name}`;
    
    const { error: uploadError } = await supabase.storage
      .from('recordings')
      .upload(fileName, recording.blob, {
        contentType: recording.mime || 'audio/webm',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading recording:', uploadError);
      return null;
    }

    const { data, error } = await supabase
      .from('recordings')
      .insert({
        user_id: user.id,
        name: recording.name,
        duration: recording.duration,
        storage_path: fileName,
        mime_type: recording.mime,
        file_extension: recording.ext,
        file_size: recording.bytes,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Error saving recording metadata:', error);
      return null;
    }

    const { data: urlData } = await supabase.storage
      .from('recordings')
      .createSignedUrl(fileName, 3600);

    return {
      id: data.id,
      name: data.name,
      duration: data.duration,
      createdAt: data.created_at,
      url: urlData?.signedUrl || '',
      mime: data.mime_type || undefined,
      ext: data.file_extension || undefined,
      bytes: data.file_size ? Number(data.file_size) : undefined,
    };
  },

  async remove(id: string): Promise<void> {
    const { data: recording } = await supabase
      .from('recordings')
      .select('storage_path')
      .eq('id', id)
      .single();

    if (recording) {
      await supabase.storage
        .from('recordings')
        .remove([recording.storage_path]);
    }

    const { error } = await supabase
      .from('recordings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting recording:', error);
    }
  },

  async get(id: string): Promise<Recording | null> {
    const { data, error } = await supabase
      .from('recordings')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Error fetching recording:', error);
      return null;
    }

    const { data: urlData } = await supabase.storage
      .from('recordings')
      .createSignedUrl(data.storage_path, 3600);

    return {
      id: data.id,
      name: data.name,
      duration: data.duration,
      createdAt: data.created_at,
      url: urlData?.signedUrl || '',
      mime: data.mime_type || undefined,
      ext: data.file_extension || undefined,
      bytes: data.file_size ? Number(data.file_size) : undefined,
    };
  }
};
