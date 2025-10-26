export interface PsychoedSnippet {
  id: string;
  title: string;
  category: string;
  content: string;
  duration?: string;
}

export const mockPsychoedSnippets: PsychoedSnippet[] = [
  {
    id: "pe_001",
    title: "4-7-8 Breathing Technique",
    category: "anxiety",
    content: "Find a comfortable position. Breathe in through your nose for 4 counts. Hold your breath for 7 counts. Exhale completely through your mouth for 8 counts. Repeat 3-4 times. This activates your parasympathetic nervous system, reducing anxiety and promoting calm.",
    duration: "2 minutes"
  },
  {
    id: "pe_002",
    title: "Sleep Hygiene Basics",
    category: "sleep",
    content: "Keep a consistent sleep schedule, even on weekends. Make your bedroom cool (16-19°C), dark, and quiet. Avoid screens 1 hour before bed - the blue light disrupts melatonin. Wind down with calming activities like reading or gentle stretching. Limit caffeine after 2pm and avoid alcohol as a sleep aid.",
    duration: "ongoing"
  },
  {
    id: "pe_003",
    title: "Mindfulness Body Scan",
    category: "stress",
    content: "Lie down comfortably. Close your eyes. Starting at your toes, notice sensations without judgment. Slowly move attention up through feet, legs, torso, arms, and head. If your mind wanders, gently bring it back. This builds awareness of physical tension and promotes relaxation.",
    duration: "10-15 minutes"
  },
  {
    id: "pe_004",
    title: "Basic Budgeting Framework",
    category: "finance",
    content: "Track all income and expenses for one month. Categorize spending: essentials (rent, utilities, food), debt repayment, savings, discretionary. Use the 50/30/20 rule as a guide: 50% needs, 30% wants, 20% savings/debt. Identify areas to reduce spending. Free budgeting apps like Moneysmart's TrackMySPEND can help.",
    duration: "ongoing"
  },
  {
    id: "pe_005",
    title: "Grounding 5-4-3-2-1 Technique",
    category: "anxiety",
    content: "When feeling overwhelmed, name: 5 things you can see, 4 things you can touch, 3 things you can hear, 2 things you can smell, 1 thing you can taste. This brings you into the present moment and interrupts anxious thought patterns.",
    duration: "3-5 minutes"
  },
  {
    id: "pe_006",
    title: "Setting Healthy Boundaries",
    category: "relationships",
    content: "Boundaries protect your wellbeing. It's okay to say no. Be clear and direct: 'I can't do that' rather than making excuses. Prepare for pushback - people used to your yes may resist. Boundaries are about your behavior, not controlling others. Practice with small boundaries first. Seek support if family/friends don't respect limits.",
    duration: "ongoing practice"
  }
];

export const getSnippetsByCategory = (category: string): PsychoedSnippet[] => {
  return mockPsychoedSnippets.filter(s => s.category === category);
};
