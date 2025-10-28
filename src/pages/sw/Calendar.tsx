import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Calendar as CalendarIcon } from "lucide-react";
import { format, startOfWeek, addDays } from "date-fns";

interface CaseReminder {
  id: string;
  clientName: string;
  caseType: "routine" | "moderate" | "high-risk";
  followUpDate: Date;
  notes: string;
}

// Mock data for demonstration
const mockReminders: CaseReminder[] = [
  {
    id: "1",
    clientName: "John D.",
    caseType: "high-risk",
    followUpDate: new Date(2025, 9, 28),
    notes: "Crisis intervention follow-up"
  },
  {
    id: "2",
    clientName: "Sarah M.",
    caseType: "routine",
    followUpDate: new Date(2025, 9, 29),
    notes: "Regular check-in"
  },
  {
    id: "3",
    clientName: "Mike L.",
    caseType: "high-risk",
    followUpDate: new Date(2025, 9, 30),
    notes: "Safety plan review"
  },
  {
    id: "4",
    clientName: "Emma T.",
    caseType: "moderate",
    followUpDate: new Date(2025, 9, 31),
    notes: "Progress assessment"
  },
  {
    id: "5",
    clientName: "David K.",
    caseType: "high-risk",
    followUpDate: new Date(2025, 10, 1),
    notes: "Mental health assessment"
  },
  {
    id: "6",
    clientName: "Lisa R.",
    caseType: "high-risk",
    followUpDate: new Date(2025, 10, 2),
    notes: "Emergency housing follow-up"
  }
];

const Calendar = () => {
  const [currentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  // Count high-risk cases this week
  const highRiskCount = mockReminders.filter(r => r.caseType === "high-risk").length;
  const exceedsLimit = highRiskCount > 3;

  const getCasesByDay = (day: Date) => {
    return mockReminders.filter(reminder => 
      format(reminder.followUpDate, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
    );
  };

  const getCaseTypeColor = (type: CaseReminder["caseType"]) => {
    switch (type) {
      case "high-risk":
        return "destructive";
      case "moderate":
        return "default";
      case "routine":
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Weekly Calendar</h1>
        <p className="text-muted-foreground mt-2">
          Case follow-up reminders and schedule overview
        </p>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Week of {format(currentWeekStart, "MMM dd, yyyy")}
          </CardTitle>
          <CardDescription>
            High-risk cases: {highRiskCount}/3 {exceedsLimit && "(⚠️ Over limit)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {weekDays.map((day) => {
              const cases = getCasesByDay(day);
              const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
              
              return (
                <Card 
                  key={day.toISOString()} 
                  className={isToday ? "border-primary" : ""}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">
                      {format(day, "EEE")}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {format(day, "MMM dd")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {cases.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No cases</p>
                    ) : (
                      cases.map((reminder) => (
                        <div 
                          key={reminder.id}
                          className="p-2 rounded-lg bg-muted/50 space-y-1"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs font-medium truncate">
                              {reminder.clientName}
                            </p>
                            <Badge 
                              variant={getCaseTypeColor(reminder.caseType)}
                              className="text-[10px] px-1 py-0"
                            >
                              {reminder.caseType}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground line-clamp-2">
                            {reminder.notes}
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

      <Card>
        <CardHeader>
          <CardTitle>Schedule Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-destructive/10">
              <p className="text-sm font-medium text-destructive">High-Risk Cases</p>
              <p className="text-2xl font-bold mt-1">{highRiskCount}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm font-medium">Moderate Cases</p>
              <p className="text-2xl font-bold mt-1">
                {mockReminders.filter(r => r.caseType === "moderate").length}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm font-medium">Routine Cases</p>
              <p className="text-2xl font-bold mt-1">
                {mockReminders.filter(r => r.caseType === "routine").length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Calendar;
