import { correctSentence } from './wordCorrection';

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
 * @returns Corrected text
 */
export function applyCorrections(text: string, matches: GrammarMatch[]): string {
  if (!matches || matches.length === 0) return text;

  // Sort by offset descending to apply from end to start
  const sorted = [...matches]
    .filter(m => m.replacements && m.replacements.length > 0)
    .sort((a, b) => b.offset - a.offset);

  let corrected = text;
  for (const match of sorted) {
    const replacement = match.replacements[0].value;
    const before = corrected.slice(0, match.offset);
    const after = corrected.slice(match.offset + match.length);
    corrected = before + replacement + after;
  }

  return corrected;
}

/**
 * Auto-correct text by checking grammar and applying all suggestions
 * IMPORTANT: Also applies word corrections after grammar to preserve proper names
 * (e.g., prevents LanguageTool from changing "jenisha" back to "geisha")
 * @param text - Text to correct
 * @param language - Language code
 * @returns Corrected text with both grammar and word corrections applied
 */
export async function autoCorrect(
  text: string,
  language: 'en-US' | 'hi-IN' = 'en-US'
): Promise<string> {
  const result = await checkGrammar(text, language);
  const grammarCorrected = applyCorrections(text, result.matches);
  
  // Apply word corrections AFTER grammar corrections
  // This ensures that proper names (like "jenisha") don't get "fixed" by LanguageTool
  const finalCorrected = correctSentence(grammarCorrected);
  
  if (grammarCorrected !== finalCorrected) {
    console.log('Word corrections applied after grammar check');
    console.log('Before word correction:', grammarCorrected);
    console.log('After word correction:', finalCorrected);
  }
  
  return finalCorrected;
}
