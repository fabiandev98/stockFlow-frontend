export function formatDisplayDate(value: string | null | undefined): string {
  if (!value) return "-";

  const [datePart] = value.split("T");
  const parts = datePart?.split("-") ?? [];

  if (parts.length !== 3) return value;

  const [year, month, day] = parts;
  if (!year || !month || !day) return value;

  return `${day}/${month}/${year}`;
}
