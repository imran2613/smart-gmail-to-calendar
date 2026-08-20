import { google } from 'googleapis';
import { ExtractedEmailData } from './ai';
import { addDays, subDays } from 'date-fns';

export async function createCalendarEvent(accessToken: string, refreshToken: string, data: ExtractedEmailData) {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  const calendar = google.calendar({ version: 'v3', auth });

  if (!data.dueDate) {
    throw new Error('Cannot create event without a dueDate');
  }

  const eventDate = new Date(data.dueDate);
  // Default to 1-hour event
  const endDate = new Date(eventDate.getTime() + 60 * 60 * 1000);

  // Set up reminders
  // For high priority, we might want to remind 3 days before.
  let reminderMinutes = 24 * 60; // 1 day before
  if (data.priority === 'High') {
    reminderMinutes = 3 * 24 * 60; // 3 days before
  } else if (data.priority === 'Low') {
    reminderMinutes = 60; // 1 hour before
  }

  const event = {
    summary: data.title || 'Actionable Item',
    description: `Created automatically by Smart Email Assistant.\nCategory: ${data.category}\nPriority: ${data.priority}\nAmount: ${data.amount || 'N/A'}`,
    start: {
      dateTime: eventDate.toISOString(),
    },
    end: {
      dateTime: endDate.toISOString(),
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: reminderMinutes },
        { method: 'email', minutes: reminderMinutes },
      ],
    },
  };

  try {
    const res = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });
    return res.data;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
}
