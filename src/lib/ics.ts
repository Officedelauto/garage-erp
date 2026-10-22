// Génère un flux iCalendar (RFC 5545) minimal, suffisant pour un abonnement en lecture
// seule depuis Google Agenda ("Ajouter un agenda > À partir d'une URL").
function escapeIcsText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function formatIcsDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export type IcsEvent = {
  uid: string;
  start: Date;
  end?: Date | null;
  summary: string;
  description?: string | null;
};

export function buildIcsFeed(calendarName: string, events: IcsEvent[]) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Octane Connect//FR",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
  ];

  const now = formatIcsDate(new Date());

  for (const ev of events) {
    const end = ev.end ?? new Date(ev.start.getTime() + 60 * 60 * 1000);
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${ev.uid}@garage-erp`);
    lines.push(`DTSTAMP:${now}`);
    lines.push(`DTSTART:${formatIcsDate(ev.start)}`);
    lines.push(`DTEND:${formatIcsDate(end)}`);
    lines.push(`SUMMARY:${escapeIcsText(ev.summary)}`);
    if (ev.description) lines.push(`DESCRIPTION:${escapeIcsText(ev.description)}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
