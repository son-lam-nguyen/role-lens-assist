export interface Transcript {
  id: string;
  title: string;
  durationSec: number;
  createdAt: string;
  text: string;
  keyphrases: string[];
  flags: string[];
  confidence: number;
  piiMasked: boolean;
  tldr: string[];
}

export const mockTranscripts: Transcript[] = [
  {
    id: "sess_001",
    title: "Housing & Finance Stress",
    durationSec: 186,
    createdAt: "2025-10-20T10:15:00Z",
    text: "Client expressed significant anxiety about rent increase coming next month. They mentioned overdue bills including electricity and phone bills. Currently struggling to make ends meet with casual work hours being reduced. Discussed budgeting options and emergency relief services available. Client showed interest in financial counseling referral. Also mentioned housing stress due to landlord threatening non-renewal if rent not paid on time.",
    keyphrases: ["rent increase", "overdue bills", "anxiety", "reduced work hours", "financial counseling"],
    flags: ["finance", "housing", "anxiety"],
    confidence: 0.87,
    piiMasked: true,
    tldr: [
      "Client facing rent increase and overdue utility bills",
      "Work hours reduced, struggling financially",
      "Open to financial counseling and emergency relief services"
    ]
  },
  {
    id: "sess_002",
    title: "Family Conflict Resolution",
    durationSec: 234,
    createdAt: "2025-10-19T14:30:00Z",
    text: "Discussion centered on ongoing conflict with adult son regarding substance use. Client feeling helpless and frustrated. Son refusing treatment despite multiple interventions. Client asking about family therapy options and boundaries. Also concerned about grandson's wellbeing in this situation. Explored communication strategies and local family support groups.",
    keyphrases: ["family conflict", "substance use", "boundaries", "family therapy", "communication"],
    flags: ["family", "addiction", "emotional-distress"],
    confidence: 0.92,
    piiMasked: true,
    tldr: [
      "Ongoing family conflict related to son's substance use",
      "Client seeking family therapy and boundary-setting strategies",
      "Concern for grandson's wellbeing, discussed support groups"
    ]
  }
];

export const processAudioMock = async (file: File): Promise<Transcript> => {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const newTranscript: Transcript = {
    id: `sess_${Date.now()}`,
    title: file.name.replace(/\.[^/.]+$/, ""),
    durationSec: Math.floor(Math.random() * 300) + 60,
    createdAt: new Date().toISOString(),
    text: "This is a simulated transcript from the uploaded audio file. Client discussed various challenges including work-life balance, stress management, and seeking support for family issues. Mentioned feeling overwhelmed with recent life changes and looking for coping strategies. Expressed interest in mindfulness techniques and community support groups.",
    keyphrases: ["work-life balance", "stress management", "family support", "coping strategies"],
    flags: ["anxiety", "work-stress"],
    confidence: 0.85,
    piiMasked: true,
    tldr: [
      "Client experiencing work-life balance challenges",
      "Seeking stress management and coping strategies",
      "Interested in mindfulness and community support"
    ]
  };
  
  return newTranscript;
};
