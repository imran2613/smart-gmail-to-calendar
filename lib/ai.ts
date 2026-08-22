export interface ExtractedEmailData {
  isActionable: boolean;
  category?: 'Bill' | 'Payment' | 'Meeting' | 'Assignment' | 'Deadline' | 'Other';
  amount?: string;
  dueDate?: string; // ISO Date String
  title?: string;
  priority?: 'High' | 'Medium' | 'Low';
}

export async function analyzeEmail(subject: string, from: string, bodyText: string): Promise<ExtractedEmailData | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not set!');
    return null;
  }

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
  "isActionable": boolean,
  "category": string, // One of: "Bill", "Payment", "Meeting", "Assignment", "Deadline", "Other"
  "amount": string, // e.g. "₹1,850" or null if not applicable
  "dueDate": string, // ISO Date string (e.g. "2026-08-28T10:00:00Z") or null
  "title": string, // A concise, descriptive title for a calendar event
  "priority": string // "High", "Medium", or "Low"
}

Respond ONLY with the JSON object. No markdown formatting or backticks.
`;

  // Try multiple API versions and models via direct REST calls (bypass SDK entirely)
  const attempts = [
    { version: 'v1beta', model: 'gemini-2.0-flash' },
    { version: 'v1', model: 'gemini-2.0-flash' },
    { version: 'v1beta', model: 'gemini-2.0-flash-lite' },
    { version: 'v1', model: 'gemini-pro' },
  ];

  for (const { version, model } of attempts) {
    const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`;
    console.log(`Trying Gemini REST API: ${version}/models/${model}`);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        console.error(`Gemini ${version}/${model} returned ${res.status}: ${errBody}`);
        continue; // try next model/version
      }

      const json = await res.json();
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        console.warn(`Gemini ${version}/${model} returned empty text`);
        continue;
      }

      console.log(`Gemini ${version}/${model} SUCCESS! Response:`, text.substring(0, 200));
      const sanitized = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(sanitized) as ExtractedEmailData;
    } catch (error) {
      console.error(`Gemini ${version}/${model} fetch error:`, error);
    }
  }

  console.error('All Gemini API attempts failed.');
  return null;
}
