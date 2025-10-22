// Word Correction Utility
// Fixes common misrecognitions from the backend spell-checker

/**
 * Dictionary of known word corrections
 * Key: Wrong word from backend
 * Value: Correct word
 * 
 * IMPORTANT: All keys and values should be lowercase
 * The correctWord() function handles capitalization automatically
 */
export const wordCorrections: Record<string, string> = {
  // === NAMES - Common misrecognitions ===
  
  // Add your commonly used names here
  // Pattern: 'wrong_spelling': 'correct_name'
  
  // Example names (uncomment and modify as needed):
  // 'geesha': 'jenisha',  // if backend gives "geesha" and you want "jenisha"
  // 'jon': 'john',
  // 'mery': 'mary',
  // 'mike': 'michael',
  // 'rob': 'robert',
  // 'dave': 'david',
  
  // === COMMON WORDS - Typical sign language misrecognitions ===
  // Add common word corrections below
  // Example:
  // 'watter': 'water',
  // 'helloo': 'hello',
  // 'thx': 'thanks',
};

/**
 * Correct a single word if it's in the corrections dictionary
 * NOTE: o→0 conversion is now handled in the BACKEND (before spell-check)
 * to prevent spell-checker from converting "5050" back to "too"
 */
export function correctWord(word: string): string {
  const lowercased = word.toLowerCase();
  
  if (wordCorrections[lowercased]) {
    // Preserve original capitalization
    const corrected = wordCorrections[lowercased];
    
    if (word[0] === word[0].toUpperCase()) {
      // Original was capitalized, capitalize correction
      return corrected.charAt(0).toUpperCase() + corrected.slice(1);
    }
    
    return corrected;
  }
  
  return word;
}

/**
 * Correct all words in a sentence
 * NOTE: o→0 conversion is now handled in the BACKEND
 */
export function correctSentence(sentence: string): string {
  const words = sentence.split(' ');
  const correctedWords = words.map(word => correctWord(word));
  return correctedWords.join(' ');
}

/**
 * Add a new correction to the dictionary dynamically
 * Useful for adding corrections at runtime
 */
export function addCorrection(wrongWord: string, correctWord: string): void {
  wordCorrections[wrongWord.toLowerCase()] = correctWord.toLowerCase();
  console.log(`✅ Added correction: ${wrongWord} → ${correctWord}`);
}

/**
 * Add multiple corrections at once
 * Useful for batch adding names or common misrecognitions
 * 
 * @example
 * addMultipleCorrections({
 *   'jon': 'john',
 *   'mery': 'mary',
 *   'mike': 'michael'
 * });
 */
export function addMultipleCorrections(corrections: Record<string, string>): void {
  Object.entries(corrections).forEach(([wrong, correct]) => {
    wordCorrections[wrong.toLowerCase()] = correct.toLowerCase();
  });
  console.log(`✅ Added ${Object.keys(corrections).length} corrections`);
}

/**
 * Helper: Add all common variations of a name
 * Automatically generates common misspellings
 * 
 * @example
 * addNameVariations('sarah', ['sara', 'sarra', 'sahra']);
 */
export function addNameVariations(correctName: string, variations: string[]): void {
  variations.forEach(variant => {
    wordCorrections[variant.toLowerCase()] = correctName.toLowerCase();
  });
  console.log(`✅ Added ${variations.length} variations for "${correctName}"`);
}

/**
 * Get all corrections currently in the dictionary
 * Useful for debugging or exporting corrections
 */
export function getAllCorrections(): Record<string, string> {
  return { ...wordCorrections };
}

/**
 * Remove a correction from the dictionary
 */
export function removeCorrection(wrongWord: string): void {
  const lowercased = wrongWord.toLowerCase();
  if (wordCorrections[lowercased]) {
    delete wordCorrections[lowercased];
    console.log(`❌ Removed correction: ${wrongWord}`);
  }
}

/**
 * Check if a correction exists for a word
 */
export function hasCorrection(word: string): boolean {
  return wordCorrections[word.toLowerCase()] !== undefined;
}
