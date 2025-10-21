# LanguageTool Grammar Correction - Troubleshooting

## Fixed: API Connection Issue ✅

The grammar correction now uses the **official free LanguageTool API** which works directly from the browser.

### What Changed

- ✅ Switched from `languagetool-api` npm package to direct API calls
- ✅ Using official endpoint: `https://api.languagetool.org/v2/check`
- ✅ No API key required
- ✅ CORS-enabled (works from browser)

## How to Test

### 1. Quick Browser Test

Open browser console (F12) and run:

```javascript
// Copy and paste this into browser console
const formData = new URLSearchParams();
formData.append("text", "I goed to the store yesterday");
formData.append("language", "en-US");

fetch("https://api.languagetool.org/v2/check", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: formData.toString(),
})
  .then((res) => res.json())
  .then((data) => {
    console.log("✅ API Working! Found", data.matches.length, "issues");
    console.log(
      "Suggestions:",
      data.matches.map((m) => m.replacements[0].value)
    );
  })
  .catch((err) => console.error("❌ API Failed:", err));
```

### 2. Test in Your App

1. Start the dev server: `npm run dev`
2. Open the app in browser
3. Sign some text to create a sentence
4. Click **"Fix Grammar"** button
5. Check browser console for logs

## Common Issues & Solutions

### Issue 1: "Grammar correction failed"

**Possible causes:**

- No internet connection
- Firewall blocking LanguageTool API
- Rate limit exceeded (20 requests/min per IP)

**Solutions:**

1. Check internet connection
2. Try in incognito/private window
3. Wait 1 minute and try again (rate limit)
4. Check browser console for detailed error

### Issue 2: Button doesn't appear

**Cause:** No sentence text yet

**Solution:**

- Start recognition
- Sign some gestures
- Stop recognition
- Button should appear next to "Full Sentence" heading

### Issue 3: No corrections applied

**Possible causes:**

- Text is already correct
- API returned no suggestions
- Text too short (less than 3 words)

**Check:**

- Look for toast message: "No corrections needed!"
- Browser console will log original vs corrected text

### Issue 4: CORS errors

**Symptom:** Console shows "CORS policy" error

**Solution:**

- This shouldn't happen with `api.languagetool.org` (CORS-enabled)
- If it does, clear browser cache
- Try different browser
- Check if browser extension is blocking

## API Limits

### Free Tier

- **Rate limit:** ~20 requests per minute per IP
- **Text length:** Up to 10,000 characters per request
- **Languages:** 30+ supported
- **Cost:** Free

### If You Hit Rate Limits

Options:

1. Wait 1 minute between requests
2. Self-host LanguageTool (see below)
3. Use LanguageTool Premium API (paid)

## Self-Hosting (Advanced)

If you need unlimited requests, you can run LanguageTool locally:

### 1. Download LanguageTool

```bash
# Download from https://languagetool.org/download/
wget https://languagetool.org/download/LanguageTool-stable.zip
unzip LanguageTool-stable.zip
```

### 2. Start Server

```bash
cd LanguageTool-6.x
java -cp languagetool-server.jar org.languagetool.server.HTTPServer --port 8081 --allow-origin "*"
```

### 3. Update Code

In `src/lib/grammar.ts`, change the URL:

```typescript
const response = await fetch("http://localhost:8081/v2/check", {
  // ... rest stays the same
});
```

## Verification Checklist

✅ Check these if grammar correction isn't working:

- [ ] Internet connection is active
- [ ] Browser console shows no CORS errors
- [ ] Dev server is running (`npm run dev`)
- [ ] Sentence text exists (not empty)
- [ ] Clicked "Fix Grammar" button
- [ ] Waited for "Checking grammar..." toast
- [ ] Checked console logs for errors

## Debug Logs

The app logs useful info to console:

```
Original: i goed to school yesterday
Corrected: I went to school yesterday
```

If you don't see these logs, check browser console (F12) for errors.

## Still Not Working?

If grammar correction still doesn't work:

1. **Test the API directly** (use browser test above)
2. **Check browser console** for error messages
3. **Try a different browser** (Chrome, Firefox, Edge)
4. **Disable browser extensions** that might block requests
5. **Check firewall/antivirus** settings

## Alternative: Offline Grammar Check

If you can't use the online API, I can install a lightweight offline grammar checker:

```bash
npm install write-good compromise
```

This won't be as accurate but works completely offline. Let me know if you need this alternative!
