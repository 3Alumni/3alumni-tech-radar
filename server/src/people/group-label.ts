/** SEM permit categories, written out so the API does not return < or >. */
const GROUPS: Record<string, string> = {
  "Kurzaufenthalter (L) >= 12 Monate": "Short-stay permit L, 12 months or longer",
  "Kurzaufenthalter > 4 bis < 12 Monate": "Short-stay permit, 4 to 12 months",
  "Kurzaufenthalter <= 4 Monate": "Short-stay permit, up to 4 months",
  "Musiker und Künstler <= 8 Monate": "Musicians and artists, up to 8 months",
  "Dienstleistungserbringern <= 4 Monate": "Service providers, up to 4 months",
  "Aufenthalter (B)": "Residence permit B",
  "Niedergelassene (C)": "Settlement permit C",
  "Aufenthalter (B) mit Erwerb": "Residence permit B, in work",
  "Aufenthalter (B) ohne Erwerb": "Residence permit B, not in work",
  "Ständige ausl. Bevölkerung": "Permanent foreign residents",
  "Nicht ständige ausl. Bevölkerung": "Non-permanent foreign residents",
};

/** Official category name as published by SEM. */
export function readableGroup(raw: string): string {
  return GROUPS[raw.trim()] ?? raw.trim();
}

/** Stored labels look like "Foreign residents, Kurzaufenthalter (L) >= 12 Monate". */
export function readableLabel(label: string): string {
  const split = label.indexOf(", ");
  if (split === -1) return label;
  const group = readableGroup(label.slice(split + 2));
  return `${label.slice(0, split + 2)}${group}`;
}
