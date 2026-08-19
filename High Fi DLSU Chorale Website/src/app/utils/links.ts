/** Returns true if `link` is a usable absolute http(s) URL (not empty, not placeholder text). */
export function isValidLink(link?: string): boolean {
  if (!link) return false;
  if (link.includes('...')) return false;
  try {
    const url = new URL(link);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
