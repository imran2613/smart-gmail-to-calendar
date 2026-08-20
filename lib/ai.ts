import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ExtractedEmailData {
  isActionable: boolean;
  category?: 'Bill' | 'Payment' | 'Meeting' | 'Assignment' | 'Deadline' | 'Other';
  amount?: string;
  dueDate?: string; // ISO Date String
  title?: string;
  priority?: 'High' | 'Medium' | 'Low';
}

export async function analyzeEmail(subject: string, from: string, bodyText: string): Promise<ExtractedEmailData | null> {
  const prompt = `
You are a Smart Email Assistant. Your job is to read an email and extract important actionable details if they exist.
Actionable items include: Bills, Payments due, Meetings, Assignments, or Deadlines.

Analyze the following email:
From: ${from}
Subject: ${subject}
Body:
${bodyText}

Output the result as a strict JSON object with the following schema:
{
  "isActionable": boolean, // true if it's a bill, meeting, deadline, etc., false otherwise
  "category": string, // One of: "Bill", "Payment", "Meeting", "Assignment", "Deadline", "Other" (only if isActionable is true)
  "amount": string, // e.g. "₹1,850" or null if not applicable
  "dueDate": string, // ISO Date string (e.g. "2026-08-28T10:00:00Z") of when it is due or happening. Convert relative dates to exact dates based on the current context if possible. Use null if no date is found.
  "title": string, // A concise, descriptive title for a calendar event (e.g., "Electricity Bill Payment")
  "priority": string // "High", "Medium", or "Low"
}

Respond ONLY with the JSON object. No markdown formatting or backticks.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
         responseMimeType: 'application/json',
      }
    });

    const text = response.text;
    if (!text) return null;

    const sanitizedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data: ExtractedEmailData = JSON.parse(sanitizedText);
    
    return data;
  } catch (error) {
    console.error('Error analyzing email with Gemini:', error);
    return null;
  }
}
