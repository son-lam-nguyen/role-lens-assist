import { getISOWeek, getYear } from "date-fns";

export type CaseRisk = "low" | "moderate" | "high";

export interface CalendarEvent {
  id: string;
  caseId?: string;
  title: string;
  client: string;
  risk: CaseRisk;
  startISO: string; // ISO 8601 datetime string
  endISO: string;
  notes?: string;
}

const STORAGE_KEY = "sw_calendar_events";

class CalendarStore {
  private getEvents(): CalendarEvent[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private saveEvents(events: CalendarEvent[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }

  listAll(): CalendarEvent[] {
    return this.getEvents();
  }

  listByWeek(weekStart: Date): CalendarEvent[] {
    const events = this.getEvents();
    const weekNumber = getISOWeek(weekStart);
    const year = getYear(weekStart);

    return events.filter((event) => {
      const eventDate = new Date(event.startISO);
      return getISOWeek(eventDate) === weekNumber && getYear(eventDate) === year;
    });
  }

  countHeavy(weekStart: Date): number {
    const weekEvents = this.listByWeek(weekStart);
    return weekEvents.filter((e) => e.risk === "high").length;
  }

  add(event: Omit<CalendarEvent, "id">): CalendarEvent {
    const newEvent: CalendarEvent = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    const events = this.getEvents();
    events.push(newEvent);
    this.saveEvents(events);
    return newEvent;
  }

  update(id: string, patch: Partial<Omit<CalendarEvent, "id">>): CalendarEvent | null {
    const events = this.getEvents();
    const index = events.findIndex((e) => e.id === id);
    if (index === -1) return null;

    events[index] = { ...events[index], ...patch };
    this.saveEvents(events);
    return events[index];
  }

  remove(id: string): boolean {
    const events = this.getEvents();
    const filtered = events.filter((e) => e.id !== id);
    if (filtered.length === events.length) return false;
    this.saveEvents(filtered);
    return true;
  }

  getById(id: string): CalendarEvent | null {
    const events = this.getEvents();
    return events.find((e) => e.id === id) || null;
  }
}

export const calendarStore = new CalendarStore();
