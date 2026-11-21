// BFS canton numbers (the `id` of each canton in swiss-maps TopoJSON) with the names the app shows.
export const CANTONS: Record<number, string> = {
  1: 'Zürich', 2: 'Bern', 3: 'Lucerne', 4: 'Uri', 5: 'Schwyz', 6: 'Obwalden', 7: 'Nidwalden',
  8: 'Glarus', 9: 'Zug', 10: 'Fribourg', 11: 'Solothurn', 12: 'Basel-Stadt', 13: 'Basel-Landschaft',
  14: 'Schaffhausen', 15: 'Appenzell Ausserrhoden', 16: 'Appenzell Innerrhoden', 17: 'St. Gallen',
  18: 'Graubünden', 19: 'Aargau', 20: 'Thurgau', 21: 'Ticino', 22: 'Vaud', 23: 'Valais',
  24: 'Neuchâtel', 25: 'Geneva', 26: 'Jura',
}

// Other spellings the data might use (German, French, Italian, ASCII).
const ALIASES: Record<string, number> = {
  zurich: 1, zuerich: 1, berne: 2, luzern: 3, lucerne: 3, freiburg: 10, fribourg: 10,
  'basel-land': 13, baselland: 13, 'st. gallen': 17, 'st gallen': 17, 'sankt gallen': 17,
  graubunden: 18, grisons: 18, grigioni: 18, tessin: 21, ticino: 21, waadt: 22, vaud: 22,
  wallis: 23, valais: 23, neuenburg: 24, neuchatel: 24, geneve: 25, genf: 25, geneva: 25, ginevra: 25,
}

const norm = (s: string) => s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

/** Canton name as written in the snapshot → BFS number, or null if unknown. */
export function cantonId(name: string): number | null {
  const n = norm(name)
  for (const [id, label] of Object.entries(CANTONS)) if (norm(label) === n) return Number(id)
  return ALIASES[n] ?? null
}
