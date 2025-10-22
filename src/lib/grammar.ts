// List of names/terms that must never be altered by grammar fixes
// Add user names and domain-specific terms here (lowercase preferred)
const PROTECTED_NAMES = new Set<string>([
  'jenisha',
  'geisha',
  'glenisha',
  'calida',
  'brenelle',
  'supreetha',
  'clarissa',
  'deepak',
  'sunitha',
  'supriya',
  'sowmya',
  'viyonna',
  'maria',
  'viona',
  'violet',
  'jerald',
  'ram',
  'sam',
  'rakshitha',
  'dsouza',
  'tauro',
  'serrao',
  'pereira',
  'shetty',
  'poojary',
  'kulal',
  'menezes',
]);
/**
 * Add one or more protected names at runtime
 * These are matched case-insensitively on word boundaries and never altered
 */
export function addProtectedNames(names: string | string[]): void {
  const list = Array.isArray(names) ? names : [names];
  for (const n of list) {
    if (!n) continue;
    PROTECTED_NAMES.add(n.toLowerCase());
  }
}

/**
 * Get current protected names (lowercased)
 */
export function getProtectedNames(): string[] {
  return Array.from(PROTECTED_NAMES);
}

export interface GrammarMatch {
  message: string;
  shortMessage?: string;
  offset: number;
  length: number;
  replacements: { value: string }[];
  context?: { text: string; offset: number; length: number };
}

export interface GrammarCheckResult {
  matches: GrammarMatch[];
  originalText: string;
}

/**
 * Check grammar and spelling using LanguageTool public API
 * Uses the official free public API endpoint
 * @param text - Text to check
 * @param language - Language code (e.g., 'en-US', 'hi-IN')
 * @returns Grammar check results with matches and suggestions
 */
export async function checkGrammar(
  text: string,
  language: 'en-US' | 'hi-IN' = 'en-US'
): Promise<GrammarCheckResult> {
  if (!text || text.trim().length === 0) {
    return { matches: [], originalText: text };
  }

  try {
    // Use LanguageTool's free public API
    const formData = new URLSearchParams();
    formData.append('text', text);
    formData.append('language', language);
    
    const response = await fetch('https://api.languagetool.org/v2/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      throw new Error(`LanguageTool API error: ${response.status}`);
    }

    const result = await response.json();

    return {
      matches: result.matches || [],
      originalText: text,
    };
  } catch (error) {
    console.error('Grammar check failed:', error);
    // Return empty matches on error to avoid breaking the app
    return { matches: [], originalText: text };
  }
}

/**
 * Apply the first (best) replacement suggestion for each match
 * Applies from end to start to avoid offset shifts
 * @param text - Original text
 * @param matches - Grammar matches from checkGrammar
 * @param protectedRanges - Ranges in the original text that must not be modified
 * @returns Corrected text
 */
export function applyCorrections(
  text: string,
  matches: GrammarMatch[],
  protectedRanges: Array<{ start: number; end: number }> = []
): string {
  if (!matches || matches.length === 0) return text;

  // Helper: simple Levenshtein distance
  const editDistance = (a: string, b: string): number => {
    a = a.toLowerCase();
    b = b.toLowerCase();
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    const prev = new Array(b.length + 1).fill(0).map((_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const curr = [i];
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        curr[j] = Math.min(
          curr[j - 1] + 1,
          prev[j] + 1,
          prev[j - 1] + cost
        );
      }
      for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
    }
    return prev[b.length];
  };

  const isNameLike = (token: string): boolean => {
    const w = token.toLowerCase().replace(/[^a-z0-9']/gi, '');
    if (!w) return false;
    if ([...PROTECTED_NAMES].includes(w)) return true;
    // within distance <= 2 of any protected name
    for (const p of PROTECTED_NAMES) {
      if (editDistance(w, p) <= 2) return true;
    }
    return false;
  };

  // Sort by offset descending to apply from end to start
  const sorted = [...matches]
    .filter(m => m.replacements && m.replacements.length > 0)
    .sort((a, b) => b.offset - a.offset);

  let corrected = text;
  for (const match of sorted) {
    // Skip corrections that overlap with any protected range
    const matchStart = match.offset;
    const matchEnd = match.offset + match.length;
    const overlapsProtected = protectedRanges.some(r => matchStart < r.end && matchEnd > r.start);
    if (overlapsProtected) {
      continue;
    }

    const originalToken = text.slice(match.offset, match.offset + match.length);
    const replacement = match.replacements[0].value;

    // Skip if the original token is name-like OR replacement is a protected name
    if (isNameLike(originalToken) || PROTECTED_NAMES.has(replacement.toLowerCase())) {
      continue;
    }

    const before = corrected.slice(0, match.offset);
    const after = corrected.slice(match.offset + match.length);
    corrected = before + replacement + after;
  }

  return corrected;
}

/**
 * Find ranges of protected names in text (case-insensitive, word-boundary matches)
 */
function findProtectedNameRanges(text: string): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = [];
  if (PROTECTED_NAMES.size === 0) return ranges;

  // Build one regex per name to ensure word-boundary accurate matches
  for (const name of PROTECTED_NAMES) {
    // Escape regex chars in name (in case)
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      ranges.push({ start: match.index, end: match.index + match[0].length });
    }
  }

  // Merge overlapping ranges just in case
  ranges.sort((a, b) => a.start - b.start);
  const merged: Array<{ start: number; end: number }> = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (!last || r.start > last.end) {
      merged.push({ ...r });
    } else if (r.end > last.end) {
      last.end = r.end;
    }
  }
  return merged;
}

/**
 * Auto-correct text by checking grammar and applying all suggestions
 * Protected names will not be altered by grammar corrections
 * @param text - Text to correct
 * @param language - Language code
 * @returns Corrected text with grammar corrections applied
 */
export async function autoCorrect(
  text: string,
  language: 'en-US' | 'hi-IN' = 'en-US'
): Promise<string> {
  const result = await checkGrammar(text, language);

  // Compute protected ranges on the ORIGINAL text so offsets align
  const protectedRanges = findProtectedNameRanges(text);
  const grammarCorrected = applyCorrections(text, result.matches, protectedRanges);
  
  return grammarCorrected;
}
