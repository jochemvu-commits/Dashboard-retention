
import { GoogleGenAI } from "@google/genai";
import { Member } from "../types";

// Always use a function to get a fresh instance of the AI client with the latest API key
export const generateOutreachMessage = async (member: Member, type: 'at-risk' | 'milestone' | 'pr'): Promise<string> => {
  if (!process.env.API_KEY) {
    return `Hey ${member.name}! We've missed you at the gym. Hope everything is okay! 💪`;
  }

  // Create a new instance right before use as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    You are an encouraging CrossFit Gym Owner. 
    Generate a short, friendly WhatsApp message for a member.
    
    Member Details:
    - Name: ${member.name}
    - Total Classes: ${member.totalClasses}
    - Last Visit: ${member.lastVisitDate}
    - Recent PR: ${member.lastPRExercise} (${member.lastPRDate})
    
    Message Type: ${type}
    
    Guidelines:
    - Tone: Encouraging, personal, and professional.
    - Style: Use a few emojis (💪, 🔥, 🏋️).
    - Length: Under 250 characters.
    - Specific: Reference their stats if relevant.
    
    Return ONLY the message text.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
    });
    // .text is a property, not a method
    return response.text?.trim() || "Error generating message.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Something went wrong generating the message.";
  }
};
