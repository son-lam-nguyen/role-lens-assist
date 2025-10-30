import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Calendar as CalendarIcon, Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfWeek, addDays, addWeeks, startOfToday } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import { calendarStore, CalendarEvent, CaseRisk } from "@/lib/calendar/store";

interface FormData {
  client: string;
  title: string;
  risk: CaseRisk;
  date: string;
  startTime: string;
  endTime: string;
  notes: string;
}

const Calendar = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    client: "",
    title: "",
    risk: "low",
    date: "",
    startTime: "09:00",
    endTime: "10:00",
    notes: "",
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  useEffect(() => {
    loadEvents();
  }, [currentWeekStart]);

  const loadEvents = async () => {
    const weekEvents = await calendarStore.listByWeek(currentWeekStart);
    setEvents(weekEvents);
  };

  const highRiskCount = events.filter(e => e.risk === "high").length;
  const exceedsLimit = highRiskCount > 3;

  const getEventsByDay = (day: Date) => {
    return events.filter(event => 
      format(new Date(event.startISO), "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
    );
  };

  const getRiskColor = (risk: CaseRisk) => {
    switch (risk) {
      case "high":
        return "destructive";
      case "moderate":
        return "default";
      case "low":
        return "secondary";
    }
  };

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    setEditingEvent(null);
    setFormData({
      client: "",
      title: "",
      risk: "low",
      date: format(day, "yyyy-MM-dd"),
      startTime: "09:00",
      endTime: "10:00",
      notes: "",
    });
    setDialogOpen(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setEditingEvent(event);
    const startDate = new Date(event.startISO);
    const endDate = new Date(event.endISO);
    setFormData({
      client: event.client,
      title: event.title,
      risk: event.risk,
      date: format(startDate, "yyyy-MM-dd"),
      startTime: format(startDate, "HH:mm"),
      endTime: format(endDate, "HH:mm"),
      notes: event.notes || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    // Validate fields
    if (!formData.client.trim() || !formData.title.trim() || !formData.date) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const startISO = `${formData.date}T${formData.startTime}:00`;
    const endISO = `${formData.date}T${formData.endTime}:00`;
    const weekStart = startOfWeek(new Date(formData.date), { weekStartsOn: 1 });

    // Check heavy case limit
    if (formData.risk === "high") {
      const currentHeavyCount = await calendarStore.countHeavy(weekStart);
      const isEditingSameWeek = editingEvent && 
        startOfWeek(new Date(editingEvent.startISO), { weekStartsOn: 1 }).getTime() === weekStart.getTime();
      const wasHeavy = editingEvent?.risk === "high";

      if (currentHeavyCount >= 3 && (!isEditingSameWeek || !wasHeavy)) {
        toast({
          title: "Limit Reached",
          description: "Maximum of 3 high-risk cases per week. Please choose a different week or lower the risk level.",
          variant: "destructive",
        });
        return;
      }
    }

    if (editingEvent) {
      await calendarStore.update(editingEvent.id, {
        client: formData.client,
        title: formData.title,
        risk: formData.risk,
        startISO,
        endISO,
        notes: formData.notes,
      });
      toast({
        title: "Event Updated",
        description: "Follow-up has been updated successfully.",
      });
    } else {
      await calendarStore.add({
        client: formData.client,
        title: formData.title,
        risk: formData.risk,
        startISO,
        endISO,
        notes: formData.notes,
      });
      toast({
        title: "Event Added",
        description: "Follow-up has been scheduled successfully.",
      });
    }

    setDialogOpen(false);
    loadEvents();
  };

  const handleDelete = async () => {
    if (!eventToDelete) return;
    
    await calendarStore.remove(eventToDelete);
    toast({
      title: "Event Removed",
      description: "Follow-up has been deleted.",
    });
    
    setDeleteDialogOpen(false);
    setDialogOpen(false);
    setEventToDelete(null);
    loadEvents();
  };

  const confirmDelete = (eventId: string) => {
    setEventToDelete(eventId);
    setDeleteDialogOpen(true);
  };

  const goToToday = () => {
    setCurrentWeekStart(startOfWeek(startOfToday(), { weekStartsOn: 1 }));
  };

  const previousWeek = () => {
    setCurrentWeekStart(prev => addWeeks(prev, -1));
  };

  const nextWeek = () => {
    setCurrentWeekStart(prev => addWeeks(prev, 1));
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="bg-gradient-to-r from-purple-600/5 via-primary/5 to-transparent rounded-2xl p-6 border border-purple-600/10">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold">Weekly Calendar</h1>
            </div>
            <p className="text-foreground/70 text-base ml-13">
              Case follow-up reminders and schedule overview
            </p>
          </div>
          <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={previousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={nextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        </div>
      </div>

      {exceedsLimit && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Warning:</strong> You have {highRiskCount} high-risk cases scheduled this week. 
            The recommended maximum is 3 cases per week to ensure quality care.
          </AlertDescription>
        </Alert>
      )}

      <Card className="card-hover border-l-4 border-l-purple-600 bg-gradient-to-br from-purple-600/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-600/10 flex items-center justify-center">
              <CalendarIcon className="w-4 h-4 text-purple-600" />
            </div>
            Week of {format(currentWeekStart, "MMM dd, yyyy")}
          </CardTitle>
          <CardDescription>
            High-risk cases: {highRiskCount}/3 {exceedsLimit && "(⚠️ Over limit)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {weekDays.map((day) => {
              const dayEvents = getEventsByDay(day);
              const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
              
              return (
                <Card 
                  key={day.toISOString()} 
                  className={isToday ? "border-primary" : ""}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-semibold">
                          {format(day, "EEE")}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {format(day, "MMM dd")}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleDayClick(day)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {dayEvents.length === 0 ? (
                      <button
                        onClick={() => handleDayClick(day)}
                        className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-left"
                      >
                        Click to add
                      </button>
                    ) : (
                      dayEvents.map((event) => (
                        <div 
                          key={event.id}
                          className="group p-2 rounded-lg bg-muted/50 space-y-1 cursor-pointer hover:bg-muted transition-colors relative"
                          onClick={() => handleEventClick(event)}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs font-medium truncate">
                              {event.client}
                            </p>
                            <div className="flex items-center gap-1">
                              <Badge 
                                variant={getRiskColor(event.risk)}
                                className="text-[10px] px-1 py-0"
                              >
                                {event.risk}
                              </Badge>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  confirmDelete(event.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </button>
                            </div>
                          </div>
                          <p className="text-[10px] font-medium text-muted-foreground">
                            {event.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {format(new Date(event.startISO), "HH:mm")} - {format(new Date(event.endISO), "HH:mm")}
                          </p>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="card-hover bg-gradient-to-br from-background to-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarIcon className="w-4 h-4 text-primary" />
            </div>
            Schedule Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border-l-4 border-l-destructive bg-gradient-to-br from-destructive/10 to-transparent hover:shadow-md transition-shadow">
              <p className="text-sm font-medium text-destructive uppercase tracking-wider">High-Risk Cases</p>
              <p className="text-3xl font-bold mt-2">{highRiskCount}/3</p>
            </div>
            <div className="p-4 rounded-xl border-l-4 border-l-primary bg-gradient-to-br from-primary/5 to-transparent hover:shadow-md transition-shadow">
              <p className="text-sm font-medium uppercase tracking-wider">Moderate Cases</p>
              <p className="text-3xl font-bold mt-2">
                {events.filter(e => e.risk === "moderate").length}
              </p>
            </div>
            <div className="p-4 rounded-xl border-l-4 border-l-accent bg-gradient-to-br from-accent/5 to-transparent hover:shadow-md transition-shadow">
              <p className="text-sm font-medium uppercase tracking-wider">Low-Risk Cases</p>
              <p className="text-3xl font-bold mt-2">
                {events.filter(e => e.risk === "low").length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md" onEscapeKeyDown={() => setDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? "Edit Follow-Up" : "Schedule Follow-Up"}
            </DialogTitle>
            <DialogDescription>
              {editingEvent ? "Update the follow-up details below." : "Add a new case follow-up to your calendar."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="client">Client Name *</Label>
              <Input
                id="client"
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                placeholder="e.g., John D."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Case Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Crisis intervention follow-up"
              />
            </div>
            <div className="space-y-2">
              <Label>Risk Level *</Label>
              <RadioGroup value={formData.risk} onValueChange={(value) => setFormData({ ...formData, risk: value as CaseRisk })}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="low" id="low" />
                  <Label htmlFor="low" className="font-normal cursor-pointer">Low</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="moderate" id="moderate" />
                  <Label htmlFor="moderate" className="font-normal cursor-pointer">Moderate</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="high" id="high" />
                  <Label htmlFor="high" className="font-normal cursor-pointer">High</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time *</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional details..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            {editingEvent && (
              <Button
                variant="destructive"
                onClick={() => confirmDelete(editingEvent.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingEvent ? "Update" : "Schedule"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Follow-Up</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this follow-up? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Calendar;
