// Text-to-Speech Utility
// Converts text to speech using Web Speech API with automatic language detection

/**
 * Available languages for speech synthesis
 */
export type SpeechLanguage = 'en-US' | 'hi-IN';

/**
 * Speech synthesis result
 */
export interface SpeechResult {
  success: boolean;
  message: string;
  language?: SpeechLanguage;
  text?: string;
}

/**
 * Check if speech synthesis is supported in the browser
 */
export function isSpeechSupported(): boolean {
  return 'speechSynthesis' in window;
}

/**
 * Get available voices for a specific language
 * @param language - Language code (e.g., 'en-US', 'hi-IN')
 * @returns Array of available voices for that language
 */
export function getVoicesForLanguage(language: SpeechLanguage): SpeechSynthesisVoice[] {
  if (!isSpeechSupported()) return [];
  
  const voices = window.speechSynthesis.getVoices();
  
  // Filter voices by language
  return voices.filter(voice => 
    voice.lang.startsWith(language.split('-')[0]) || 
    voice.lang === language
  );
}

/**
 * Detect if text is Hindi or English based on Unicode characters
 * @param text - Text to analyze
 * @returns 'hi-IN' if text contains Hindi/Devanagari characters, 'en-US' otherwise
 */
export function detectLanguage(text: string): SpeechLanguage {
  // Check for Devanagari Unicode range (Hindi script)
  // Devanagari range: U+0900 to U+097F
  const devanagariRegex = /[\u0900-\u097F]/;
  
  if (devanagariRegex.test(text)) {
    return 'hi-IN';
  }
  
  return 'en-US';
}

/**
 * Stop any currently speaking utterance
 */
export function stopSpeaking(): void {
  if (isSpeechSupported()) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Get the best voice for a language
 * Prefers Google voices, then native voices
 */
export function getBestVoice(language: SpeechLanguage): SpeechSynthesisVoice | null {
  const voices = getVoicesForLanguage(language);
  
  if (voices.length === 0) return null;
  
  // Prefer Google voices
  const googleVoice = voices.find(v => v.name.toLowerCase().includes('google'));
  if (googleVoice) return googleVoice;
  
  // Then prefer voices that match the exact language
  const exactMatch = voices.find(v => v.lang === language);
  if (exactMatch) return exactMatch;
  
  // Otherwise return first available
  return voices[0];
}

/**
 * Speak text using Web Speech API with automatic language detection
 * @param text - Text to speak
 * @param language - Optional: Force specific language. If not provided, auto-detects.
 * @param rate - Speech rate (0.5 to 2, default 1)
 * @param pitch - Speech pitch (0 to 2, default 1)
 * @param volume - Speech volume (0 to 1, default 1)
 * @returns Promise with result
 */
export async function speakText(
  text: string,
  language?: SpeechLanguage,
  rate: number = 1,
  pitch: number = 1,
  volume: number = 1
): Promise<SpeechResult> {
  // Validate text
  if (!text || text.trim().length === 0) {
    return {
      success: false,
      message: 'No text to speak',
    };
  }
  
  // Check browser support
  if (!isSpeechSupported()) {
    return {
      success: false,
      message: 'Speech synthesis not supported in this browser',
    };
  }
  
  // Stop any currently speaking utterance
  stopSpeaking();
  
  // Detect or use provided language
  const detectedLang = language || detectLanguage(text);
  
  return new Promise((resolve) => {
    // Load voices (may be async in some browsers)
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      
      if (voices.length === 0) {
        // Voices not loaded yet, wait
        return false;
      }
      
      // Get best voice for language
      const voice = getBestVoice(detectedLang);
      
      if (!voice) {
        resolve({
          success: false,
          message: `No voice available for ${detectedLang}`,
          language: detectedLang,
          text,
        });
        return true;
      }
      
      // Create utterance
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = voice;
      utterance.lang = detectedLang;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;
      
      // Set up event listeners
      utterance.onend = () => {
        resolve({
          success: true,
          message: 'Speech completed',
          language: detectedLang,
          text,
        });
      };
      
      utterance.onerror = (event) => {
        resolve({
          success: false,
          message: `Speech error: ${event.error}`,
          language: detectedLang,
          text,
        });
      };
      
      // Speak!
      window.speechSynthesis.speak(utterance);
      
      return true;
    };
    
    // Try to load voices
    if (!loadVoices()) {
      // If voices not ready, wait for voiceschanged event
      const handler = () => {
        if (loadVoices()) {
          window.speechSynthesis.removeEventListener('voiceschanged', handler);
        }
      };
      window.speechSynthesis.addEventListener('voiceschanged', handler);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        window.speechSynthesis.removeEventListener('voiceschanged', handler);
        resolve({
          success: false,
          message: 'Voices failed to load',
          language: detectedLang,
          text,
        });
      }, 5000);
    }
  });
}

/**
 * Check if browser is currently speaking
 */
export function isSpeaking(): boolean {
  if (!isSpeechSupported()) return false;
  return window.speechSynthesis.speaking;
}

/**
 * Pause current speech
 */
export function pauseSpeech(): void {
  if (isSpeechSupported() && isSpeaking()) {
    window.speechSynthesis.pause();
  }
}

/**
 * Resume paused speech
 */
export function resumeSpeech(): void {
  if (isSpeechSupported() && window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }
}

/**
 * Get all available voices
 */
export function getAllVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSupported()) return [];
  return window.speechSynthesis.getVoices();
}

/**
 * List all available languages
 */
export function getAvailableLanguages(): string[] {
  const voices = getAllVoices();
  const languages = new Set(voices.map(v => v.lang));
  return Array.from(languages).sort();
}

/**
 * Convenience function: Speak with English voice
 */
export async function speakEnglish(text: string): Promise<SpeechResult> {
  return speakText(text, 'en-US');
}

/**
 * Convenience function: Speak with Hindi voice
 */
export async function speakHindi(text: string): Promise<SpeechResult> {
  return speakText(text, 'hi-IN');
}
