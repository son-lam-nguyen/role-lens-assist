import { supabase } from "@/integrations/supabase/client";

export interface SOAPNote {
  id: string;
  clientId?: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  references: string[];
  createdAt: string;
  updatedAt: string;
}

class NotesStore {
  async listAll(): Promise<SOAPNote[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('soap_notes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notes:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      clientId: row.client_id || undefined,
      subjective: row.subjective || '',
      objective: row.objective || '',
      assessment: row.assessment || '',
      plan: row.plan || '',
      references: row.note_references || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async getById(id: string): Promise<SOAPNote | null> {
    const { data, error } = await supabase
      .from('soap_notes')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Error fetching note:', error);
      return null;
    }

    return {
      id: data.id,
      clientId: data.client_id || undefined,
      subjective: data.subjective || '',
      objective: data.objective || '',
      assessment: data.assessment || '',
      plan: data.plan || '',
      references: data.note_references || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async add(note: Omit<SOAPNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<SOAPNote | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('User not authenticated');
      return null;
    }

    const { data, error } = await supabase
      .from('soap_notes')
      .insert({
        user_id: user.id,
        client_id: note.clientId || null,
        subjective: note.subjective,
        objective: note.objective,
        assessment: note.assessment,
        plan: note.plan,
        note_references: note.references,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Error adding note:', error);
      return null;
    }

    return {
      id: data.id,
      clientId: data.client_id || undefined,
      subjective: data.subjective || '',
      objective: data.objective || '',
      assessment: data.assessment || '',
      plan: data.plan || '',
      references: data.note_references || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async update(id: string, updates: Partial<Omit<SOAPNote, 'id' | 'createdAt' | 'updatedAt'>>): Promise<SOAPNote | null> {
    const updateData: Record<string, any> = {};
    
    if (updates.clientId !== undefined) updateData.client_id = updates.clientId;
    if (updates.subjective !== undefined) updateData.subjective = updates.subjective;
    if (updates.objective !== undefined) updateData.objective = updates.objective;
    if (updates.assessment !== undefined) updateData.assessment = updates.assessment;
    if (updates.plan !== undefined) updateData.plan = updates.plan;
    if (updates.references !== undefined) updateData.note_references = updates.references;

    const { data, error } = await supabase
      .from('soap_notes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      console.error('Error updating note:', error);
      return null;
    }

    return {
      id: data.id,
      clientId: data.client_id || undefined,
      subjective: data.subjective || '',
      objective: data.objective || '',
      assessment: data.assessment || '',
      plan: data.plan || '',
      references: data.note_references || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async remove(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('soap_notes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting note:', error);
      return false;
    }

    return true;
  }
}

export const notesStore = new NotesStore();
