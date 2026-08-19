interface GoogleCalendarEmbedProps {
  calendarId: string;
  height?: number;
}

export function GoogleCalendarEmbed({ calendarId, height = 600 }: GoogleCalendarEmbedProps) {
  const encodedId = encodeURIComponent(calendarId);
  const src = `https://calendar.google.com/calendar/embed?src=${encodedId}&ctz=America%2FSao_Paulo&hl=pt_BR&showTitle=0&showNav=1&showPrint=0&showTabs=0&showCalendars=0&mode=MONTH`;

  return (
    <div className="w-full rounded-xl overflow-hidden border border-border-subtle shadow-sm">
      <iframe
        src={src}
        style={{ border: 0 }}
        width="100%"
        height={height}
        scrolling="no"
        title="Google Calendar Més Belle"
      />
    </div>
  );
}
