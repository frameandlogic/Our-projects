export function formatNPR(amount: number) {
  return `रु ${Math.round(amount).toLocaleString("en-IN")}`;
}

export function priceMarks(level: 1 | 2 | 3) {
  return Array.from({ length: level }, () => "रु").join(" ");
}

export function minsRange(range: [number, number]) {
  return `${range[0]}–${range[1]} min`;
}
