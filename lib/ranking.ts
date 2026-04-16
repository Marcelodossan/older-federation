export function parseMoney(value: unknown): number {
  if (typeof value === "number") return value;

  if (typeof value === "string") {
    const cleaned = value
      .replace(/[R$\s]/g, "")
      .replace(/\./g, "")
      .replace(",", ".");

    const parsed = Number(cleaned);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

export function formatMoney(value: number): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function calculateOverall(valor: unknown): number {
  const numericValue = parseMoney(valor);
  return Math.floor(numericValue / 10000);
}