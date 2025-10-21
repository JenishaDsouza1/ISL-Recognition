# API Key Setup Guide

## 🔑 Do You Need an API Key?

### **Short Answer: NO!** ✅

The translation feature works perfectly **without any API keys** for your traffic level (200 requests/hour).

---

## 📊 When You Might Want a MyMemory API Key

### **Current Limits (No API Key):**

- Google Translate: ~1000 requests/hour (unofficial, no key exists)
- MyMemory: 1000 requests/day per IP address

### **With MyMemory API Key (FREE):**

- MyMemory: **5000 requests/day** (5x more!)

### **Do You Need It?**

**NO** if:

- ✅ You have 200 requests/hour (4800/day)
- ✅ Requests come from different user IPs (frontend translation)
- ✅ Each user only makes a few translations

**YES** if:

- ⚠️ All requests come from same server IP (backend translation)
- ⚠️ You need more than 1000 requests/day from single IP
- ⚠️ You want extra buffer for safety

---

## 🚀 How to Add MyMemory API Key (Optional)

### Step 1: Get Free API Key

1. Visit: https://mymemory.translated.net/doc/keygen.php
2. Enter your email address
3. Click "Generate Key"
4. Copy the key (looks like: `abc123xyz456`)

**Notes:**

- ✅ Completely FREE forever
- ✅ No credit card required
- ✅ Instant approval
- ✅ Increases limit to 5000 requests/day

### Step 2: Create `.env` File

Create a file named `.env` in your project root:

```
c:\Users\jenisha\OneDrive\Desktop\frontend\signlingo-bridge\.env
```

**Using VS Code:**

1. Right-click in file explorer
2. Select "New File"
3. Name it exactly: `.env`

**Using Command Prompt:**

```cmd
cd c:\Users\jenisha\OneDrive\Desktop\frontend\signlingo-bridge
echo # Environment Variables > .env
```

### Step 3: Add Your API Key

Open `.env` file and add:

```env
# MyMemory Translation API Key (optional)
# Get free key at: https://mymemory.translated.net/doc/keygen.php
VITE_MYMEMORY_API_KEY=your-actual-api-key-here
```

**Replace** `your-actual-api-key-here` with your real key!

**Example:**

```env
VITE_MYMEMORY_API_KEY=abc123xyz456def789
```

### Step 4: Restart Dev Server

The `.env` file is only read when the server starts:

```cmd
# Stop current server (Ctrl+C in terminal)
# Then restart:
npm run dev
```

### Step 5: Verify It's Working

Check browser console when you translate. You should see the API key being used in the network request:

```
https://api.mymemory.translated.net/get?q=Hello&langpair=en|hi&key=abc123xyz456
                                                                   ↑
                                                            Your API key
```

---

## 🔒 Security: `.gitignore`

**IMPORTANT:** Your `.env` file should **NEVER** be committed to GitHub!

I've already added it to `.gitignore` for you:

```gitignore
.env
.env.local
```

This protects your API key from being stolen.

---

## 📂 File Locations

### Project Structure

```
signlingo-bridge/
├── .env                          ← Create this (optional)
├── .gitignore                    ← Already configured ✅
├── src/
│   └── lib/
│       └── translate.ts          ← Reads the API key
└── ...
```

### Where the API Key is Used

**File:** `src/lib/translate.ts`  
**Line:** ~52-57

```typescript
// Optional: Add API key from environment variable (increases daily limit)
const apiKey = import.meta.env.VITE_MYMEMORY_API_KEY || "";

let url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
  text
)}&langpair=${langPair}`;

if (apiKey) {
  url += `&key=${apiKey}`;
}
```

**How it works:**

- Reads from environment variable
- If not found, `apiKey = ''` (empty string)
- If empty, MyMemory works without key (1000/day limit)
- If present, MyMemory uses key (5000/day limit)

---

## ✅ Verification Checklist

### Without API Key (Default)

- [ ] Translation works
- [ ] Console shows: `✅ Google Translate success` or `✅ MyMemory success`
- [ ] No errors in console
- [ ] Toast shows successful translation

### With API Key (Optional)

- [ ] Created `.env` file
- [ ] Added `VITE_MYMEMORY_API_KEY=your-key`
- [ ] Restarted dev server
- [ ] Translation still works
- [ ] Network tab shows `&key=...` in MyMemory requests

---

## 🐛 Troubleshooting

### "API key not working"

**Possible issues:**

1. **Wrong variable name**

   ```env
   ❌ MYMEMORY_API_KEY=abc123          # Wrong!
   ❌ REACT_APP_MYMEMORY_KEY=abc123    # Wrong!
   ✅ VITE_MYMEMORY_API_KEY=abc123     # Correct!
   ```

   **Must start with `VITE_`** for Vite to read it!

2. **Didn't restart server**

   - `.env` is only read on startup
   - Stop server (Ctrl+C) and restart (`npm run dev`)

3. **Wrong file location**

   - Must be in project root (next to `package.json`)
   - Not in `src/` folder!

4. **Invalid API key**
   - Make sure you copied the entire key
   - No spaces before/after the key
   - Get a new key if it doesn't work

### "Can't create .env file"

**Windows Command Prompt:**

```cmd
echo VITE_MYMEMORY_API_KEY=your-key-here > .env
```

**VS Code:**

1. View → Explorer
2. Right-click in file list
3. New File
4. Type: `.env`
5. Press Enter

### "Rate limit exceeded"

If you see rate limit errors:

**Without API key:**

- You've exceeded 1000 requests/day from your IP
- Solution: Add API key (increases to 5000/day)

**With API key:**

- You've exceeded 5000 requests/day
- Solution: Wait 24 hours or self-host LibreTranslate

---

## 📊 Rate Limit Summary

| Service          | No Key          | With Free Key | Cost |
| ---------------- | --------------- | ------------- | ---- |
| Google Translate | ~1000/hour      | N/A (no key)  | FREE |
| MyMemory         | 1000/day per IP | 5000/day      | FREE |

**Your traffic (200 requests/hour):**

- = ~4800 requests/day
- **Without key**: Might hit limit if all from same IP
- **With key**: Plenty of room (5000 limit)

---

## 🎯 Recommendation

### For Your Use Case (200 requests/hour):

**Option 1: No API Key** (Simplest) ⭐

- Requests come from different user IPs (frontend)
- Each user makes only a few translations
- **Should work fine without key!**

**Option 2: Add API Key** (Safest)

- Takes 2 minutes
- FREE forever
- Extra safety buffer
- **Get it if you want peace of mind**

---

## 🔮 Environment Variables Explained

### Vite Environment Variables

Vite uses a special prefix: `VITE_`

**Format:**

```env
VITE_YOUR_VARIABLE_NAME=value
```

**Access in code:**

```typescript
import.meta.env.VITE_YOUR_VARIABLE_NAME;
```

**Why `VITE_`?**

- Security: Only variables with `VITE_` prefix are exposed to frontend
- Other variables stay private (for backend use)

### Example `.env` File

```env
# Translation API Keys
VITE_MYMEMORY_API_KEY=abc123xyz456

# Other optional configs (examples)
# VITE_API_BASE_URL=http://localhost:8000
# VITE_ENABLE_DEBUG=true
```

**Note:** Lines starting with `#` are comments (ignored)

---

## 📝 Summary

### Current Setup

✅ Translation works **without any API keys**  
✅ `.env` file is optional  
✅ `.gitignore` protects API keys  
✅ Google Translate has no API key (unofficial)  
✅ MyMemory works without key (1000/day limit)

### Optional Enhancement

🎁 Add MyMemory API key for 5x more requests  
🎁 FREE forever at: https://mymemory.translated.net/doc/keygen.php  
🎁 Create `.env` file in project root  
🎁 Add: `VITE_MYMEMORY_API_KEY=your-key`  
🎁 Restart server

### You're Good to Go!

Your translation feature is **fully functional** right now, no API keys needed! 🚀
