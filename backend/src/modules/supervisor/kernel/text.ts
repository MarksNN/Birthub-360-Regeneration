export function norm(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function includesPhrase(haystack: string, phrase: string): boolean {
  return norm(haystack).includes(norm(phrase));
}
