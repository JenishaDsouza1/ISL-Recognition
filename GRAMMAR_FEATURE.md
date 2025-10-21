# Grammar Correction Feature

## Overview

The ISL Recognition app now includes **automatic grammar correction** using LanguageTool API directly in the frontend.

## Features

- ✅ Grammar and spelling correction for English and Hindi
- ✅ One-click "Fix Grammar" button in the Full Sentence card
- ✅ Works entirely in the browser (no server needed)
- ✅ Supports both languages (EN/HI)

## How to Use

### 1. Basic Usage

1. Start recognition and sign to generate a sentence
2. Stop recognition when done
3. Click **"Fix Grammar"** button in the Full Sentence card
4. Corrected text will replace the original sentence

### 2. Language Support

- English (en-US): Default
- Hindi (hi-IN): Click "Translate" to switch language first, then use Fix Grammar

## Technical Details

### Files Created

- `src/lib/grammar.ts` - Grammar correction utility functions
  - `checkGrammar()` - Check text for grammar/spelling errors
  - `applyCorrections()` - Apply suggested corrections
  - `autoCorrect()` - One-step check and apply

### Dependencies

- `languagetool-api` - Official LanguageTool npm package

### API Usage

The library uses the **official free public LanguageTool API** (`api.languagetool.org`):

- ✅ No API key required
- ✅ Works directly from the browser (CORS-enabled)
- ✅ Free tier: ~20 requests/minute per IP
- ✅ Supports 30+ languages
- ⚠️ Rate limits apply for heavy usage

**Endpoint:** `https://api.languagetool.org/v2/check`

### Advanced Usage

```typescript
import { checkGrammar, applyCorrections } from "@/lib/grammar";

// Check grammar only (get suggestions)
const result = await checkGrammar("Your text here", "en-US");
console.log(result.matches); // Array of grammar issues

// Apply corrections manually
const corrected = applyCorrections("Your text here", result.matches);

// Auto-correct (one step)
import { autoCorrect } from "@/lib/grammar";
const fixed = await autoCorrect("Your text here", "en-US");
```

### Customization

#### Change Language

```typescript
await autoCorrect(text, "hi-IN"); // Hindi
await autoCorrect(text, "en-US"); // English
```

#### Self-Host LanguageTool (Optional)

For better privacy and no rate limits:

1. Run LanguageTool server locally
2. Modify `src/lib/grammar.ts`:

```typescript
const result = await LanguageToolAPI.check({
  text,
  language,
  baseURL: "http://localhost:8081", // Your local server
});
```

## Limitations

- Free API has rate limits (usually sufficient for personal use)
- Requires internet connection
- Correction quality depends on LanguageTool's rules
- Very long texts may take a few seconds

## Troubleshooting

**"Grammar correction failed" error:**

- Check internet connection
- Try again (may be temporary API issue)
- For heavy usage, consider self-hosting LanguageTool

**Slow corrections:**

- LanguageTool API can be slow for very long texts
- Consider breaking up very long sentences

**Unexpected corrections:**

- Review suggestions before accepting
- LanguageTool may not understand domain-specific terms
- You can always undo by stopping and restarting recognition

## Future Enhancements

- [ ] Show individual suggestions before applying
- [ ] Highlight corrected parts
- [ ] Undo/redo functionality
- [ ] Offline mode with local LanguageTool
- [ ] Custom dictionary for sign language terms
