// Word Correction Testing Utility
// Use this in the browser console to test and discover corrections

import { 
  correctWord, 
  correctSentence, 
  addCorrection, 
  addMultipleCorrections,
  addNameVariations,
  getAllCorrections,
  hasCorrection 
} from './wordCorrection';

/**
 * Test a list of words and see which ones get corrected
 */
export function testWords(words: string[]): void {
  console.log('=== WORD CORRECTION TEST ===\n');
  
  words.forEach(word => {
    const corrected = correctWord(word);
    const changed = corrected !== word;
    
    if (changed) {
      console.log(`✅ ${word} → ${corrected}`);
    } else {
      console.log(`⚪ ${word} (no correction)`);
    }
  });
  
  console.log('\n=== END TEST ===');
}

/**
 * Test a full sentence and see what gets corrected
 */
export function testSentence(sentence: string): void {
  const corrected = correctSentence(sentence);
  const changed = corrected !== sentence;
  
  console.log('=== SENTENCE CORRECTION TEST ===\n');
  console.log('Original: ', sentence);
  console.log('Corrected:', corrected);
  console.log('Changed:  ', changed ? '✅ YES' : '⚪ NO');
  console.log('\n=== END TEST ===');
}

/**
 * Discover what corrections are needed by comparing backend vs expected
 */
export function discoverCorrections(backendWords: string[], expectedWords: string[]): void {
  if (backendWords.length !== expectedWords.length) {
    console.error('❌ Arrays must be same length!');
    return;
  }
  
  console.log('=== DISCOVERED CORRECTIONS ===\n');
  console.log('Add these to wordCorrections dictionary:\n');
  
  backendWords.forEach((backend, index) => {
    const expected = expectedWords[index];
    if (backend.toLowerCase() !== expected.toLowerCase()) {
      console.log(`'${backend.toLowerCase()}': '${expected.toLowerCase()}',`);
    }
  });
  
  console.log('\n=== END DISCOVERY ===');
}

/**
 * Quick test for common names
 */
export function testCommonNames(): void {
  const testNames = [
    'geisha', 'geesha', 'gaisha',  // Jenisha
    'jon', 'jhon',                 // John
    'sara', 'sarra',               // Sarah
    'mike', 'mikel',               // Michael
    'dave',                        // David
    'rob',                         // Robert
  ];
  
  testWords(testNames);
}

/**
 * Show all current corrections
 */
export function showAllCorrections(): void {
  const corrections = getAllCorrections();
  
  console.log('=== ALL CORRECTIONS ===\n');
  console.log(`Total: ${Object.keys(corrections).length}\n`);
  
  Object.entries(corrections).forEach(([wrong, correct]) => {
    console.log(`  ${wrong} → ${correct}`);
  });
  
  console.log('\n=== END ===');
}

/**
 * Quick add for testing (temporary, not saved to file)
 */
export function quickAdd(wrong: string, correct: string): void {
  addCorrection(wrong, correct);
  
  // Test it
  console.log('\nTesting correction:');
  console.log(`  Input: ${wrong}`);
  console.log(`  Output: ${correctWord(wrong)}`);
}

/**
 * Batch test multiple sentences
 */
export function testSentences(sentences: string[]): void {
  console.log('=== MULTIPLE SENTENCES TEST ===\n');
  
  sentences.forEach((sentence, index) => {
    const corrected = correctSentence(sentence);
    const changed = corrected !== sentence;
    
    console.log(`${index + 1}. Original:  ${sentence}`);
    console.log(`   Corrected: ${corrected}`);
    console.log(`   Changed:   ${changed ? '✅' : '⚪'}\n`);
  });
  
  console.log('=== END TEST ===');
}

// Export everything for easy console access
export const WordCorrectionTester = {
  testWords,
  testSentence,
  testSentences,
  testCommonNames,
  discoverCorrections,
  showAllCorrections,
  quickAdd,
  
  // Also expose main functions
  correctWord,
  correctSentence,
  addCorrection,
  addMultipleCorrections,
  addNameVariations,
  getAllCorrections,
  hasCorrection,
};

// Make it globally available in browser console
if (typeof window !== 'undefined') {
  (window as any).WordTester = WordCorrectionTester;
  console.log('💡 Word Correction Tester loaded! Use "WordTester" in console.');
  console.log('Examples:');
  console.log('  WordTester.testCommonNames()');
  console.log('  WordTester.testWords(["geisha", "sara", "mike"])');
  console.log('  WordTester.testSentence("hi i am geisha")');
  console.log('  WordTester.showAllCorrections()');
}

export default WordCorrectionTester;
