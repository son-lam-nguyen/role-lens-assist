export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  hasCrisisFlag?: boolean;
}

const crisisKeywords = [
  'kill myself', 'suicide', 'end my life', 'want to die', 'harm myself',
  'self harm', 'overdose', 'hurt myself', 'cutting', 'not worth living'
];

const diagnosisKeywords = [
  'diagnose', 'do i have', 'am i depressed', 'am i bipolar', 'is this adhd',
  'whats wrong with me', 'mental illness', 'disorder test'
];

const medicationKeywords = [
  'medication', 'prescription', 'drug', 'antidepressant', 'should i take',
  'stop taking', 'dose', 'pill'
];

export const detectCrisis = (message: string): boolean => {
  const messageLower = message.toLowerCase();
  return crisisKeywords.some(keyword => messageLower.includes(keyword));
};

export const detectDiagnosisRequest = (message: string): boolean => {
  const messageLower = message.toLowerCase();
  return diagnosisKeywords.some(keyword => messageLower.includes(keyword));
};

export const detectMedicationRequest = (message: string): boolean => {
  const messageLower = message.toLowerCase();
  return medicationKeywords.some(keyword => messageLower.includes(keyword));
};

export const generateChatbotResponse = async (message: string): Promise<ChatMessage> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const hasCrisis = detectCrisis(message);
  const hasDiagnosis = detectDiagnosisRequest(message);
  const hasMedication = detectMedicationRequest(message);
  
  let response = '';
  
  if (hasCrisis) {
    response = "I'm concerned about what you've shared. Your safety is the most important thing right now. Please reach out to a crisis service immediately:\n\n🆘 Lifeline: 13 11 14 (24/7)\n🆘 Emergency: 000\n\nThese services have trained counselors who can provide immediate support. Would you like me to share more crisis contacts?";
  } else if (hasDiagnosis) {
    response = "I can't provide diagnoses - that requires assessment by a qualified healthcare professional like a GP or psychologist. What I can do is share information about common experiences and suggest you speak with your GP, who can create a Mental Health Treatment Plan if needed. This gives you Medicare rebates for psychology sessions. Would you like information about finding support services?";
  } else if (hasMedication) {
    response = "Medication decisions should always be made with your doctor - I can't provide medical advice about prescriptions. Your GP is the best person to discuss medication options, side effects, or any concerns you have. If you're experiencing side effects or want to change medication, please contact your prescribing doctor rather than stopping suddenly. Would you like information about preparing for a medication review appointment?";
  } else {
    // Generate contextual response based on keywords
    const messageLower = message.toLowerCase();
    
    if (messageLower.includes('sleep') || messageLower.includes('insomnia')) {
      response = "Sleep difficulties are really common, especially when stressed. Some helpful strategies include keeping consistent sleep/wake times, creating a calming bedtime routine, keeping your bedroom cool and dark, and avoiding screens an hour before bed. The 4-7-8 breathing technique can also help wind down. Would you like me to share more sleep hygiene tips?";
    } else if (messageLower.includes('anxiety') || messageLower.includes('anxious') || messageLower.includes('worried')) {
      response = "Anxiety can feel overwhelming. Grounding techniques like the 5-4-3-2-1 method (name 5 things you see, 4 you touch, 3 you hear, 2 you smell, 1 you taste) can help bring you back to the present. The 4-7-8 breathing technique is also very effective. Regular exercise, limiting caffeine, and talking to someone you trust can all help. If anxiety is significantly impacting your life, consider speaking with a GP about a Mental Health Treatment Plan.";
    } else if (messageLower.includes('stress')) {
      response = "Stress management is so important for wellbeing. Try breaking tasks into smaller steps, practice saying no to non-essential commitments, and build in regular breaks. Mindfulness, even just 5 minutes of focused breathing, can help. Physical activity is one of the most effective stress relievers. Don't hesitate to reach out to your support network or speak with a professional if stress feels unmanageable.";
    } else if (messageLower.includes('budget') || messageLower.includes('money') || messageLower.includes('financial')) {
      response = "Financial stress is really tough. Start by tracking all income and expenses for a month to see where money's going. The 50/30/20 rule (50% needs, 30% wants, 20% savings/debt) can guide budgeting. Free services like financial counseling (1800 007 007) can help with debt, hardship arrangements, and accessing emergency relief. The Moneysmart website has great free resources and budgeting tools.";
    } else {
      response = "Thanks for sharing that with me. While I can provide general information and coping strategies, I'm not a replacement for professional support. Your support worker can offer more personalized guidance. In the meantime, I'm here to share information about mental health, wellbeing strategies, and where to find help. What would be most useful for you right now?";
    }
  }
  
  return {
    id: `msg_${Date.now()}`,
    role: 'assistant',
    content: response,
    timestamp: new Date().toISOString(),
    hasCrisisFlag: hasCrisis
  };
};

export const quickReplies = [
  { id: 'qr_001', text: 'Breathing technique', query: 'Can you teach me a breathing technique for anxiety?' },
  { id: 'qr_002', text: 'Sleep hygiene tips', query: "I'm having trouble sleeping, any tips?" },
  { id: 'qr_003', text: 'Budgeting help', query: 'I need help with budgeting and managing money' },
  { id: 'qr_004', text: 'Grounding for anxiety', query: "What's a quick technique for anxiety?" },
  { id: 'qr_005', text: 'Crisis contacts', query: 'Show me crisis support contacts' },
];
