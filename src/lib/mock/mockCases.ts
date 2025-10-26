export interface Case {
  id: string;
  title: string;
  tags: string[];
  summary: string;
  score: number;
  guidelineId: string;
  matchedKeywords: string[];
}

export const mockCases: Case[] = [
  {
    id: "case_001",
    title: "Financial Crisis & Rent Arrears Support",
    tags: ["finance", "housing", "emergency-relief"],
    summary: "Client facing eviction due to rent arrears. Connected with emergency relief services and financial counseling. Developed payment plan with landlord.",
    score: 0.94,
    guidelineId: "guide_003",
    matchedKeywords: ["rent", "financial", "emergency"]
  },
  {
    id: "case_002",
    title: "Family Substance Use Intervention",
    tags: ["family", "addiction", "boundaries"],
    summary: "Adult child with substance use issues. Family therapy recommended with focus on boundary-setting and enabling behaviors. Connected to Al-Anon.",
    score: 0.91,
    guidelineId: "guide_005",
    matchedKeywords: ["family", "substance", "boundaries"]
  },
  {
    id: "case_003",
    title: "Housing Instability in Older Adults",
    tags: ["housing", "older-adults", "aged-care"],
    summary: "Senior client at risk of homelessness. Coordinated with aged care services and housing support. Assessed for NDIS eligibility.",
    score: 0.88,
    guidelineId: "guide_004",
    matchedKeywords: ["housing", "senior", "support"]
  },
  {
    id: "case_004",
    title: "Youth Employment & Financial Literacy",
    tags: ["youth", "employment", "finance"],
    summary: "Young person seeking employment support and budgeting skills. Connected with youth employment programs and financial literacy workshops.",
    score: 0.85,
    guidelineId: "guide_007",
    matchedKeywords: ["employment", "youth", "budgeting"]
  },
  {
    id: "case_005",
    title: "Anxiety Management in Workplace",
    tags: ["anxiety", "work-stress", "mental-health"],
    summary: "Client experiencing workplace anxiety affecting performance. Workplace adjustments discussed, mindfulness techniques introduced, GP referral for mental health care plan.",
    score: 0.83,
    guidelineId: "guide_002",
    matchedKeywords: ["anxiety", "work", "stress"]
  },
  {
    id: "case_006",
    title: "Family Violence Risk Assessment",
    tags: ["family", "safety", "crisis"],
    summary: "Client disclosed family violence concerns. Safety planning implemented, police and DV services contacted. Emergency accommodation arranged.",
    score: 0.80,
    guidelineId: "guide_008",
    matchedKeywords: ["family", "safety", "crisis"]
  }
];

export const searchCases = (query: string, tags: string[] = []): Case[] => {
  const queryLower = query.toLowerCase();
  
  let results = mockCases.filter(c => {
    const matchesQuery = c.title.toLowerCase().includes(queryLower) ||
                        c.summary.toLowerCase().includes(queryLower) ||
                        c.tags.some(t => t.toLowerCase().includes(queryLower));
    
    const matchesTags = tags.length === 0 || tags.some(tag => c.tags.includes(tag));
    
    return matchesQuery && matchesTags;
  });
  
  // Sort by score
  results.sort((a, b) => b.score - a.score);
  
  return results;
};
