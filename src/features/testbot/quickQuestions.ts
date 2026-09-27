/** Quick-question chips per niche: English, Tanglish and Tamil script. */
export const QUICK_QUESTIONS: Record<string, string[]> = {
  dental_clinic: [
    "What is the price for teeth cleaning?",
    "Root canal ku evlo aagum?",
    "நாளை காலை appointment கிடைக்குமா?",
    "I have severe tooth pain",
  ],
  skin_clinic: [
    "How much is a facial peel?",
    "Pimple treatment ku evlo aagum?",
    "முடி உதிர்வுக்கு சிகிச்சை இருக்கா?",
    "Can I book for Saturday?",
  ],
  salon: [
    "Haircut price for men?",
    "Bridal makeup ku evlo?",
    "இன்று மாலை slot இருக்கா?",
    "Do you have women stylists?",
  ],
  coaching_centre: [
    "What is the fee for NEET coaching?",
    "Demo class eppo irukku?",
    "12ஆம் வகுப்புக்கு batch timings என்ன?",
    "Will my son get a top rank?",
  ],
  gym: [
    "Monthly membership price?",
    "Ladies batch irukka?",
    "Personal training கட்டணம் எவ்வளவு?",
    "Can I get a free trial?",
  ],
  bakery_sweets: [
    "1 kg black forest cake price?",
    "Eggless cake kedaikkuma?",
    "நாளைக்கு 2 kg mysore pak order பண்ணலாமா?",
    "Do you deliver to Anna Nagar?",
  ],
  real_estate: [
    "2 BHK price in Sholinganallur?",
    "Site visit ku eppo varalam?",
    "வீட்டுக் கடன் உதவி கிடைக்குமா?",
    "Can you give a discount?",
  ],
  restaurant: [
    "What are your timings?",
    "Party order ku menu anuppunga",
    "இன்று இரவு table book பண்ணலாமா?",
    "Do you deliver?",
  ],
  other: ["What are your timings?", "Price evlo?", "முகவரி என்ன?", "Can I talk to the owner?"],
};

export function quickQuestionsFor(niche: string): string[] {
  return QUICK_QUESTIONS[niche] ?? QUICK_QUESTIONS.other;
}
