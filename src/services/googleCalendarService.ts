import { EventRecord } from '../types';

export interface CalendarEventPayload {
  summary: string;
  description: string;
  location?: string;
  startDateTime: string; // ISO string
  endDateTime: string; // ISO string
  attendees?: string[];
}

export const createGoogleCalendarEvent = async (
  accessToken: string,
  payload: CalendarEventPayload
): Promise<{ id: string; htmlLink: string }> => {
  const body: any = {
    summary: payload.summary,
    description: payload.description,
    start: {
      dateTime: payload.startDateTime,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo',
    },
    end: {
      dateTime: payload.endDateTime,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo',
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 30 },
      ],
    },
  };

  if (payload.location) {
    body.location = payload.location;
  }

  if (payload.attendees && payload.attendees.length > 0) {
    body.attendees = payload.attendees.map((email) => ({ email }));
  }

  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData?.error?.message || `Erro no Google Agenda (${response.status})`
    );
  }

  const data = await response.json();
  return {
    id: data.id,
    htmlLink: data.htmlLink,
  };
};

export const listUpcomingCalendarEvents = async (accessToken: string) => {
  const now = new Date().toISOString();
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
      now
    )}&maxResults=10&singleEvents=true&orderBy=startTime`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Não foi possível listar eventos da Google Agenda.');
  }

  const data = await response.json();
  return data.items || [];
};

/**
 * Creates an instant web link to open Google Calendar in browser with pre-filled details
 */
export const buildGoogleCalendarWebUrl = (event: EventRecord, customDate?: string) => {
  const title = encodeURIComponent(`[SafeTrack] Análise Ocorrência #${event.item} - ${event.area}`);
  const details = encodeURIComponent(
    `Análise de Ocorrência Operacional\n` +
    `Item: #${event.item}\n` +
    `Área: ${event.area} (${event.local})\n` +
    `Envolvido: ${event.envolvido}\n` +
    `Encarregado: ${event.encarregado}\n` +
    `Equipamento: ${event.equipamento} (${event.placaTag})\n` +
    `Status Atual: ${event.status}\n` +
    `Descrição:\n${event.descricao}\n`
  );
  const location = encodeURIComponent(`${event.local} - ${event.area}`);

  // Calculate start/end date
  let startIso: string;
  let endIso: string;

  if (customDate) {
    const d = new Date(customDate);
    const start = d.toISOString().replace(/-|:|\.\d\d\d/g, '');
    d.setHours(d.getHours() + 1);
    const end = d.toISOString().replace(/-|:|\.\d\d\d/g, '');
    startIso = start;
    endIso = end;
  } else {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    const start = d.toISOString().replace(/-|:|\.\d\d\d/g, '');
    d.setHours(11, 0, 0, 0);
    const end = d.toISOString().replace(/-|:|\.\d\d\d/g, '');
    startIso = start;
    endIso = end;
  }

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${startIso}/${endIso}`;
};
