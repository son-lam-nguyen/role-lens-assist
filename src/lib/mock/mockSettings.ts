export interface CrisisContact {
  id: string;
  name: string;
  phone: string;
  description: string;
  available: string;
}

export interface AppSettings {
  autoDeleteAudio: boolean;
  maskPIIDefault: boolean;
  showConfidenceScore: boolean;
}

export const defaultSettings: AppSettings = {
  autoDeleteAudio: true,
  maskPIIDefault: true,
  showConfidenceScore: true
};

export const crisisContactsAU: CrisisContact[] = [
  {
    id: "crisis_001",
    name: "Lifeline",
    phone: "13 11 14",
    description: "24/7 crisis support and suicide prevention",
    available: "24/7"
  },
  {
    id: "crisis_002",
    name: "Emergency Services",
    phone: "000",
    description: "Police, Ambulance, Fire - for immediate life-threatening situations",
    available: "24/7"
  },
  {
    id: "crisis_003",
    name: "Beyond Blue",
    phone: "1300 22 4636",
    description: "Mental health support and information",
    available: "24/7"
  },
  {
    id: "crisis_004",
    name: "Suicide Call Back Service",
    phone: "1300 659 467",
    description: "24/7 telephone and online counseling for people affected by suicide",
    available: "24/7"
  },
  {
    id: "crisis_005",
    name: "1800RESPECT",
    phone: "1800 737 732",
    description: "Family and domestic violence counseling",
    available: "24/7"
  },
  {
    id: "crisis_006",
    name: "Kids Helpline",
    phone: "1800 55 1800",
    description: "Counseling service for young people aged 5-25",
    available: "24/7"
  },
  {
    id: "crisis_007",
    name: "MensLine Australia",
    phone: "1300 78 99 78",
    description: "Professional telephone and online support for men",
    available: "24/7"
  },
  {
    id: "crisis_008",
    name: "QLife",
    phone: "1800 184 527",
    description: "Anonymous LGBTI+ peer support and referral",
    available: "3pm-midnight daily"
  }
];
