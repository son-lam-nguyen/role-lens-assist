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
  clientId?: string;
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
        clientId: row.client_id || undefined,
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

    // Sanitize filename to avoid special characters that might cause storage errors
    const sanitizedName = recording.name
      .replace(/[^\w\s.-]/g, '') // Remove special chars except word chars, spaces, dots, hyphens
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/_{2,}/g, '_'); // Replace multiple underscores with single

    // Build a more robust ASCII-only fallback
    const asciiName = sanitizedName
      .normalize('NFKD')
      .replace(/[^\w\s.-]/g, '')
      .replace(/[^\x20-\x7E]/g, '') // Remove non-ASCII
      .replace(/\s+/g, '_')
      .replace(/_{2,}/g, '_')
      .slice(0, 200);

    let finalFileName = `${user.id}/${Date.now()}_${sanitizedName}`;

    // Try upload, then retry once with stricter ASCII-only name if needed
    let uploadErr: any = null;
    try {
      const { error } = await supabase.storage
        .from('recordings')
        .upload(finalFileName, recording.blob, {
          contentType: recording.mime || 'audio/webm',
          upsert: false,
        });
      uploadErr = error;
    } catch (e) {
      uploadErr = e as any;
    }

    if (uploadErr) {
      console.error('Initial upload failed, retrying with ASCII name:', uploadErr);
      finalFileName = `${user.id}/${Date.now()}_${asciiName}`;
      const { error: retryError } = await supabase.storage
        .from('recordings')
        .upload(finalFileName, recording.blob, {
          contentType: recording.mime || 'audio/webm',
          upsert: false,
        });

      if (retryError) {
        console.error('Error uploading recording (retry):', retryError);
        return null;
      }
    }

    const { data, error } = await supabase
      .from('recordings')
      .insert({
        user_id: user.id,
        name: recording.name,
        duration: recording.duration,
        storage_path: finalFileName,
        mime_type: recording.mime,
        file_extension: recording.ext,
        file_size: recording.bytes,
        client_id: recording.clientId || null,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Error saving recording metadata:', error);
      return null;
    }

    const { data: urlData } = await supabase.storage
      .from('recordings')
      .createSignedUrl(finalFileName, 3600);

    return {
      id: data.id,
      name: data.name,
      duration: data.duration,
      createdAt: data.created_at,
      url: urlData?.signedUrl || '',
      mime: data.mime_type || undefined,
      ext: data.file_extension || undefined,
      bytes: data.file_size ? Number(data.file_size) : undefined,
      clientId: data.client_id || undefined,
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
      clientId: data.client_id || undefined,
    };
  }
};
