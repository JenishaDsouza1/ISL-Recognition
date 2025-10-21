// Translation utility with Google Translate (unofficial) + MyMemory fallback
// Supports English ↔ Hindi translation with name transliteration

interface TranslationResult {
  translatedText: string;
  service: 'google' | 'mymemory';
  originalText: string;
}

/**
 * Translate using unofficial Google Translate API
 * This is free and has the best quality (95%+ accuracy)
 * Works well for low-moderate traffic (< 1000 requests/hour)
 */
async function googleTranslate(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Google Translate failed: ${response.status}`);
  }

  const data = await response.json();
  
  // Google returns: [[[translated_text, original_text, null, null, 3], ...], ...]
  // We need to extract and concatenate all translated parts
  if (!data || !data[0]) {
    throw new Error('Invalid response from Google Translate');
  }

  const translatedText = data[0]
    .map((item: any) => item[0])
    .filter((text: string) => text)
    .join('');

  return translatedText;
}

/**
 * Translate using MyMemory API
 * Reliable fallback option with good accuracy (85%+)
 * Free tier: 1000 requests/day per IP (5000 with free API key)
 */
async function myMemoryTranslate(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  // MyMemory uses language codes like 'en' and 'hi' (not 'en-US')
  const langPair = `${sourceLang}|${targetLang}`;
  
  // Optional: Add API key from environment variable (increases daily limit)
  const apiKey = import.meta.env.VITE_MYMEMORY_API_KEY || '';
  
  let url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;
  
  if (apiKey) {
    url += `&key=${apiKey}`;
  }

  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`MyMemory translation failed: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.responseData || !data.responseData.translatedText) {
    throw new Error('Invalid response from MyMemory');
  }

  return data.responseData.translatedText;
}

/**
 * Main translation function with automatic fallback
 * Tries Google first (best quality), falls back to MyMemory if it fails
 * Names will be transliterated to target language script
 * 
 * @param text - Text to translate
 * @param fromLang - Source language ('en' for English, 'hi' for Hindi)
 * @param toLang - Target language ('en' for English, 'hi' for Hindi)
 * @returns Translation result with service used
 */
export async function translate(
  text: string,
  fromLang: 'en' | 'hi',
  toLang: 'en' | 'hi'
): Promise<TranslationResult> {
  if (!text || text.trim().length === 0) {
    throw new Error('Cannot translate empty text');
  }

  if (fromLang === toLang) {
    // No translation needed
    return {
      translatedText: text,
      service: 'google',
      originalText: text,
    };
  }

  // Try Google Translate first (best quality)
  // Google will transliterate names automatically (Jenisha → जेनिशा)
  try {
    console.log(`🔄 Trying Google Translate: ${fromLang} → ${toLang}`);
    const translatedText = await googleTranslate(text, fromLang, toLang);
    console.log(`✅ Google Translate success`);
    console.log('Original:', text);
    console.log('Translated:', translatedText);
    
    return {
      translatedText,
      service: 'google',
      originalText: text,
    };
  } catch (googleError) {
    console.warn('⚠️ Google Translate failed, trying MyMemory...', googleError);
    
    // Fallback to MyMemory
    try {
      console.log(`🔄 Trying MyMemory: ${fromLang} → ${toLang}`);
      const translatedText = await myMemoryTranslate(text, fromLang, toLang);
      console.log(`✅ MyMemory success`);
      console.log('Original:', text);
      console.log('Translated:', translatedText);
      
      return {
        translatedText,
        service: 'mymemory',
        originalText: text,
      };
    } catch (myMemoryError) {
      console.error('❌ All translation services failed', myMemoryError);
      throw new Error('Translation failed. Please check your internet connection and try again.');
    }
  }
}

/**
 * Auto-translate based on current language state
 * If currently in Hindi mode: translates Hindi → English
 * If currently in English mode: translates English → Hindi
 * 
 * @param text - Text to translate
 * @param isCurrentlyHindi - Whether the current text is in Hindi
 * @returns Translation result
 */
export async function autoTranslate(
  text: string,
  isCurrentlyHindi: boolean
): Promise<TranslationResult> {
  if (isCurrentlyHindi) {
    // Hindi → English
    return translate(text, 'hi', 'en');
  } else {
    // English → Hindi
    return translate(text, 'en', 'hi');
  }
}
