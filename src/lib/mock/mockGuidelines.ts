export interface Guideline {
  id: string;
  source: string;
  topic: string;
  excerpt: string;
  url: string;
  tags: string[];
}

export const mockGuidelines: Guideline[] = [
  {
    id: "guide_001",
    source: "Head to Health",
    topic: "Crisis Response Protocols",
    excerpt: "When a client presents in crisis, immediate risk assessment is essential. Use structured tools like the Columbia-Suicide Severity Rating Scale. Ensure safety planning includes emergency contacts, triggers identification, and coping strategies. Connect to 24/7 crisis services when indicated.",
    url: "https://headtohealth.gov.au/crisis-response",
    tags: ["crisis", "mental-health", "safety"]
  },
  {
    id: "guide_002",
    source: "Beyond Blue",
    topic: "Anxiety Management Techniques",
    excerpt: "Evidence-based approaches for anxiety include cognitive behavioral techniques, progressive muscle relaxation, and graded exposure. Encourage regular physical activity, sleep hygiene, and limiting caffeine. Mindfulness-based interventions show strong efficacy for generalized anxiety.",
    url: "https://beyondblue.org.au/anxiety",
    tags: ["anxiety", "mental-health", "cbt"]
  },
  {
    id: "guide_003",
    source: "Financial Counselling Australia",
    topic: "Emergency Relief & Financial Crisis",
    excerpt: "Financial counseling is free and confidential. Options include payment plans, hardship provisions, No Interest Loan Schemes (NILS), and emergency relief grants. Document all income/expenses. Most utilities offer hardship programs. Commonwealth financial assistance may be available.",
    url: "https://financialcounsellingaustralia.org.au",
    tags: ["finance", "emergency-relief", "budgeting"]
  },
  {
    id: "guide_004",
    source: "NDIS",
    topic: "NDIS Housing & Support",
    excerpt: "NDIS participants may access Specialist Disability Accommodation (SDA) if they have extreme functional impairment or very high support needs. Support Coordination can assist with housing search and linkages. My Place program provides housing options for NDIS participants.",
    url: "https://ndis.gov.au/housing",
    tags: ["housing", "ndis", "disability"]
  },
  {
    id: "guide_005",
    source: "Alcohol & Drug Foundation",
    topic: "Family Impact of Substance Use",
    excerpt: "Families affected by substance use benefit from education about addiction as a health condition, not moral failing. Set clear boundaries while maintaining supportive relationships. Al-Anon and Nar-Anon provide peer support. Family therapy can address enabling behaviors and communication patterns.",
    url: "https://adf.org.au/family-support",
    tags: ["addiction", "family", "boundaries"]
  },
  {
    id: "guide_006",
    source: "Lifeline",
    topic: "Suicide Risk Assessment & Safety Planning",
    excerpt: "ALWAYS take suicide ideation seriously. Ask direct questions: thoughts, plans, means, timeframe. Lethal means restriction is crucial. Safety plan should include warning signs, coping strategies, supportive contacts, professional services, and environmental safety. Follow up is essential.",
    url: "https://lifeline.org.au/suicide-prevention",
    tags: ["crisis", "suicide-prevention", "safety"]
  },
  {
    id: "guide_007",
    source: "Australian JobActive",
    topic: "Youth Employment Pathways",
    excerpt: "Youth employment services provide resume building, interview preparation, work experience placements, and training opportunities. Youth Allowance may be available. Apprenticeship/traineeship incentives exist. Address barriers including transport, childcare, and mental health support needs.",
    url: "https://jobsearch.gov.au/youth",
    tags: ["youth", "employment", "training"]
  },
  {
    id: "guide_008",
    source: "1800RESPECT",
    topic: "Family Violence Safety Planning",
    excerpt: "Safety planning is collaborative and individualized. Include: safe places to go, packed emergency bag, important documents copies, code words with trusted contacts, tech safety (social media, location services), financial preparations. Never ask 'why don't they leave' - respect timing.",
    url: "https://1800respect.org.au",
    tags: ["family-violence", "safety", "crisis"]
  },
  {
    id: "guide_009",
    source: "Centrelink",
    topic: "Income Support Eligibility",
    excerpt: "Various income support payments exist: JobSeeker (unemployed), Age Pension (seniors), Disability Support Pension, Carer Payment, Parenting Payment. Most are means-tested. Apply online via myGov. Supporting documentation required. Social workers available for complex situations.",
    url: "https://servicesaustralia.gov.au",
    tags: ["finance", "centrelink", "income-support"]
  },
  {
    id: "guide_010",
    source: "RANZCP",
    topic: "Mental Health Care Plans",
    excerpt: "GP Mental Health Treatment Plans (MHTP) provide Medicare rebates for up to 10 psychology sessions per year. GP assesses, creates plan, and provides referral. Psychologist must be registered Medicare provider. Review appointments required for additional sessions beyond initial 6.",
    url: "https://ranzcp.org.au/mhcp",
    tags: ["mental-health", "medicare", "psychology"]
  },
  {
    id: "guide_011",
    source: "Sleep Health Foundation",
    topic: "Sleep Hygiene for Mental Health",
    excerpt: "Good sleep hygiene includes: consistent sleep/wake times (even weekends), wind-down routine, cool dark quiet bedroom, no screens 1hr before bed, limit caffeine after 2pm, regular exercise (not before bed), avoid alcohol for sleep. Address underlying anxiety/depression impacting sleep.",
    url: "https://sleephealthfoundation.org.au",
    tags: ["sleep", "mental-health", "self-care"]
  },
  {
    id: "guide_012",
    source: "Older Persons Advocacy Network",
    topic: "Elder Abuse Prevention & Response",
    excerpt: "Elder abuse includes financial, physical, psychological, sexual, and neglect. Often perpetrated by family members. Indicators: unexplained financial transactions, injuries, withdrawal, fear. Reporting obligations exist in some states. Aged care advocacy services provide free support. Police involvement if immediate danger.",
    url: "https://opan.org.au/elder-abuse",
    tags: ["older-adults", "abuse", "advocacy"]
  }
];

export const getGuidelineById = (id: string): Guideline | undefined => {
  return mockGuidelines.find(g => g.id === id);
};
