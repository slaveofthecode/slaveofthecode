const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Format a `YYYY` year or `YYYY-MM` month for display. */
export function formatPoint(value: string): string {
  const match = /^(\d{4})(?:-(\d{2}))?$/.exec(value);
  if (!match) return value;
  const year = match[1] ?? value;
  const month = match[2];
  if (!month) return year;
  const label = MONTHS[Number(month) - 1] ?? month;
  return `${label} ${year}`;
}

/** Format a start/end range; a `null` end means the item is ongoing. */
export function formatRange(
  start: string,
  end: string | null,
  present: string,
): string {
  return `${formatPoint(start)} – ${end ? formatPoint(end) : present}`;
}
