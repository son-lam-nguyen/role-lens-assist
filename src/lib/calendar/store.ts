import { getISOWeek, getYear } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

export type CaseRisk = "low" | "moderate" | "high";

export interface CalendarEvent {
  id: string;
  caseId?: string;
  title: string;
  client: string;
  risk: CaseRisk;
  startISO: string;
  endISO: string;
  notes?: string;
}

class CalendarStore {
  async listAll(): Promise<CalendarEvent[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching calendar events:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      caseId: row.case_id || undefined,
      title: row.title,
      client: row.client,
      risk: row.risk as CaseRisk,
      startISO: row.start_time,
      endISO: row.end_time,
      notes: row.notes || undefined,
    }));
  }

  async listByWeek(weekStart: Date): Promise<CalendarEvent[]> {
    const events = await this.listAll();
    const weekNumber = getISOWeek(weekStart);
    const year = getYear(weekStart);

    return events.filter((event) => {
      const eventDate = new Date(event.startISO);
      return getISOWeek(eventDate) === weekNumber && getYear(eventDate) === year;
    });
  }

  async countHeavy(weekStart: Date): Promise<number> {
    const weekEvents = await this.listByWeek(weekStart);
    return weekEvents.filter((e) => e.risk === "high").length;
  }

  async add(event: Omit<CalendarEvent, "id">): Promise<CalendarEvent | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('User not authenticated');
      return null;
    }

    const { data, error } = await supabase
      .from('calendar_events')
      .insert({
        user_id: user.id,
        case_id: event.caseId || null,
        title: event.title,
        client: event.client,
        risk: event.risk,
        start_time: event.startISO,
        end_time: event.endISO,
        notes: event.notes || null,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Error adding calendar event:', error);
      return null;
    }

    return {
      id: data.id,
      caseId: data.case_id || undefined,
      title: data.title,
      client: data.client,
      risk: data.risk as CaseRisk,
      startISO: data.start_time,
      endISO: data.end_time,
      notes: data.notes || undefined,
    };
  }

  async update(id: string, patch: Partial<Omit<CalendarEvent, "id">>): Promise<CalendarEvent | null> {
    const updateData: Record<string, any> = {};
    
    if (patch.caseId !== undefined) updateData.case_id = patch.caseId;
    if (patch.title !== undefined) updateData.title = patch.title;
    if (patch.client !== undefined) updateData.client = patch.client;
    if (patch.risk !== undefined) updateData.risk = patch.risk;
    if (patch.startISO !== undefined) updateData.start_time = patch.startISO;
    if (patch.endISO !== undefined) updateData.end_time = patch.endISO;
    if (patch.notes !== undefined) updateData.notes = patch.notes;

    const { data, error } = await supabase
      .from('calendar_events')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      console.error('Error updating calendar event:', error);
      return null;
    }

    return {
      id: data.id,
      caseId: data.case_id || undefined,
      title: data.title,
      client: data.client,
      risk: data.risk as CaseRisk,
      startISO: data.start_time,
      endISO: data.end_time,
      notes: data.notes || undefined,
    };
  }

  async remove(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting calendar event:', error);
      return false;
    }

    return true;
  }

  async getById(id: string): Promise<CalendarEvent | null> {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Error fetching calendar event:', error);
      return null;
    }

    return {
      id: data.id,
      caseId: data.case_id || undefined,
      title: data.title,
      client: data.client,
      risk: data.risk as CaseRisk,
      startISO: data.start_time,
      endISO: data.end_time,
      notes: data.notes || undefined,
    };
  }
}

export const calendarStore = new CalendarStore();
