export function formatQuantity(value: string | number | null | undefined, unit?: string): string {
  const amount = new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));

  return unit ? `${amount} ${unit}` : amount;
}
