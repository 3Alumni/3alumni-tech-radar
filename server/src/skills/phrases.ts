const STOP = new Set(
  `und oder mit für der die das den dem des ein eine einer einem einen the and for with you your our wir sie von im in auf zu zur zum aus bei ist sind wird werden to of a an on at by from as is are be this that we their but not they them ihr ihre ihren ihrem ihres vous nous les des pour dans est sont avec sur par du la le et ou nicht auch als wie nach über unter zwischen ohne beim vom mehr sehr alle kann muss soll wurde wurden sein haben hat jahr jahre year years task tasks about into than then can will was were been being per sofort oder nach vereinbarung`.split(
    /\s+/,
  ),
);

export function normalizePhrase(phrase: string): string {
  return phrase.toLowerCase().replace(/\s+/g, " ").trim();
}

export function phrasesFromPosting(title: string, snippet: string): string[] {
  const found = new Map<string, string>();
  const titleTokens = tokenize(title).filter((token) => keep(token));
  collect(found, titleTokens);
  collect(
    found,
    tokenize(snippet).filter((token) => keep(token) && technical(token)),
  );
  for (let index = 0; index < titleTokens.length - 1; index += 1) {
    add(found, `${titleTokens[index]} ${titleTokens[index + 1]}`);
  }
  return [...found.values()];
}

export function technical(phrase: string): boolean {
  return /[0-9+#.]/.test(phrase) || /[a-zà-ÿ][A-Z]/.test(phrase) || /^[A-Z]{2,6}$/.test(phrase);
}

function collect(found: Map<string, string>, tokens: string[]) {
  for (const token of tokens) {
    add(found, token);
  }
}

function add(found: Map<string, string>, phrase: string) {
  const key = normalizePhrase(phrase);
  if (!found.has(key)) {
    found.set(key, phrase);
  }
}

function tokenize(text: string): string[] {
  return text
    .split(/[^0-9A-Za-zÀ-ÿ+#.]/u)
    .map((token) => token.replace(/^[.+]+|[.+]+$/g, ""))
    .filter(Boolean);
}

function keep(token: string): boolean {
  if (token.length < 2 || token.length > 40) {
    return false;
  }
  if (!/[A-Za-zÀ-ÿ]/.test(token)) {
    return false;
  }
  if (STOP.has(token.toLowerCase())) {
    return false;
  }
  if (token.length < 3 && !/[#+.]/.test(token) && !/^[A-Z]{2}$/.test(token)) {
    return false;
  }
  return true;
}
