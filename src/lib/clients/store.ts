import { supabase } from "@/integrations/supabase/client";

export type RiskLevel = 'low' | 'moderate' | 'high';

export interface AnalysisEntry {
  id: string;
  title: string;
  date: string;
  duration: number;
  riskAssessment?: {
    level: string;
    signals: string[];
  };
  summary: string[];
  keyPhrases: string[];
  speakerAnalysis?: {
    client?: {
      sentiment: string;
      topEmotions: string[];
    };
    supportWorker?: {
      sentiment: string;
      supportiveness: number;
    };
  };
  confidence: number;
}

export interface Client {
  id: string;
  name: string;
  age: number;
  gender: string;
  contact: string;
  notes: string;
  analysisNotes?: AnalysisEntry[];
  riskLevel: RiskLevel;
  assignedWorker: string;
  createdAt: string;
  updatedAt: string;
}

class ClientStore {
  async listAll(): Promise<Client[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching clients:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      age: row.age,
      gender: row.gender,
      contact: row.contact,
      notes: row.notes || '',
      analysisNotes: Array.isArray(row.analysis_notes) ? row.analysis_notes as unknown as AnalysisEntry[] : [],
      riskLevel: row.risk_level as RiskLevel,
      assignedWorker: row.assigned_worker,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async getById(id: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Error fetching client:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      age: data.age,
      gender: data.gender,
      contact: data.contact,
      notes: data.notes || '',
      analysisNotes: Array.isArray(data.analysis_notes) ? data.analysis_notes as unknown as AnalysisEntry[] : [],
      riskLevel: data.risk_level as RiskLevel,
      assignedWorker: data.assigned_worker,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async add(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client | null> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    console.log("🔍 Checking Supabase auth status...");
    console.log("User:", user);
    console.log("Error:", userError);
    
    if (!user) {
      console.error('❌ User not authenticated with Supabase');
      
      // Check if session exists
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Session status:", session ? "exists" : "none");
      
      return null;
    }
    
    console.log("✅ User authenticated:", user.email);

    const { data, error } = await supabase
      .from('clients')
      .insert({
        user_id: user.id,
        name: client.name,
        age: client.age,
        gender: client.gender,
        contact: client.contact,
        notes: client.notes,
        risk_level: client.riskLevel,
        assigned_worker: client.assignedWorker,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Error adding client:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      age: data.age,
      gender: data.gender,
      contact: data.contact,
      notes: data.notes || '',
      analysisNotes: Array.isArray(data.analysis_notes) ? data.analysis_notes as unknown as AnalysisEntry[] : [],
      riskLevel: data.risk_level as RiskLevel,
      assignedWorker: data.assigned_worker,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async update(id: string, updates: Partial<Omit<Client, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Client | null> {
    const updateData: Record<string, any> = {};
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.age !== undefined) updateData.age = updates.age;
    if (updates.gender !== undefined) updateData.gender = updates.gender;
    if (updates.contact !== undefined) updateData.contact = updates.contact;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.analysisNotes !== undefined) updateData.analysis_notes = updates.analysisNotes;
    if (updates.riskLevel !== undefined) updateData.risk_level = updates.riskLevel;
    if (updates.assignedWorker !== undefined) updateData.assigned_worker = updates.assignedWorker;

    const { data, error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      console.error('Error updating client:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      age: data.age,
      gender: data.gender,
      contact: data.contact,
      notes: data.notes || '',
      analysisNotes: Array.isArray(data.analysis_notes) ? data.analysis_notes as unknown as AnalysisEntry[] : [],
      riskLevel: data.risk_level as RiskLevel,
      assignedWorker: data.assigned_worker,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async remove(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting client:', error);
      return false;
    }

    return true;
  }
}

export const clientStore = new ClientStore();
