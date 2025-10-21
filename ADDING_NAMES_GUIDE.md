# Adding Names and Custom Corrections

## 🎯 Quick Guide: Add Your Names

### Method 1: Direct Dictionary Edit (Recommended for permanent names)

Edit `src/lib/wordCorrection.ts`:

```typescript
export const wordCorrections: Record<string, string> = {
  // === NAMES ===

  // Jenisha variations
  geisha: "jenisha",
  geesha: "jenisha",
  gaisha: "jenisha",

  // Your name variations (ADD HERE)
  john: "john", // If backend changes it
  jon: "john", // Common misspelling
  johnn: "john",

  sarah: "sarah",
  sara: "sarah",
  sarra: "sarah",

  michael: "michael",
  mike: "michael",
  mikel: "michael",

  // Add more names below...
};
```

---

### Method 2: Runtime Addition (Temporary, for testing)

In the browser console or your code:

```javascript
import {
  addCorrection,
  addMultipleCorrections,
  addNameVariations,
} from "@/lib/wordCorrection";

// Add single correction
addCorrection("jon", "john");

// Add multiple at once
addMultipleCorrections({
  sara: "sarah",
  mike: "michael",
  dave: "david",
});

// Add all variations of a name
addNameVariations("sarah", ["sara", "sarra", "sahra", "sara"]);
```

---

## 📝 Common Name Patterns

### Indian Names

```typescript
// Jenisha
'geisha': 'jenisha',
'geesha': 'jenisha',
'gaisha': 'jenisha',
'genisha': 'jenisha',

// Priya
'prya': 'priya',
'priyaa': 'priya',
'priya': 'priya',

// Rahul
'raul': 'rahul',
'rahull': 'rahul',
'rahu': 'rahul',

// Aisha
'aysha': 'aisha',
'isha': 'aisha',
'ayesha': 'aisha',

// Rohan
'rohan': 'rohan',
'rohen': 'rohan',
'rohann': 'rohan',
```

---

### Western Names

```typescript
// John
'jon': 'john',
'jhon': 'john',
'johnn': 'john',

// Sarah
'sara': 'sarah',
'sarra': 'sarah',
'sahra': 'sarah',

// Michael
'mike': 'michael',
'mikel': 'michael',
'micheal': 'michael',

// David
'dave': 'david',
'davd': 'david',
'daivd': 'david',

// Robert
'rob': 'robert',
'robrt': 'robert',
'robt': 'robert',
```

---

### Portuguese/Spanish Names

```typescript
// Dsouza
'dsousa': 'dsouza',
'd\'souza': 'dsouza',
'desouza': 'dsouza',
'desousa': 'dsouza',

// Maria
'maria': 'maria',
'marya': 'maria',
'meria': 'maria',

// Carlos
'carlos': 'carlos',
'carls': 'carlos',
'karlos': 'carlos',

// Pedro
'pedro': 'pedro',
'pedra': 'pedro',
'peedro': 'pedro',
```

---

## 🔧 Enhanced API Functions

### 1. `addCorrection(wrong, correct)`

Add a single correction.

```typescript
import { addCorrection } from "@/lib/wordCorrection";

addCorrection("jon", "john");
addCorrection("sara", "sarah");
```

---

### 2. `addMultipleCorrections(corrections)`

Add many corrections at once.

```typescript
import { addMultipleCorrections } from "@/lib/wordCorrection";

addMultipleCorrections({
  jon: "john",
  sara: "sarah",
  mike: "michael",
  dave: "david",
  rob: "robert",
});
// ✅ Added 5 corrections
```

---

### 3. `addNameVariations(name, variations)`

Add all common misspellings of a name.

```typescript
import { addNameVariations } from "@/lib/wordCorrection";

// Add all variations of "Sarah"
addNameVariations("sarah", ["sara", "sarra", "sahra", "sarha"]);
// ✅ Added 4 variations for "sarah"

// Add all variations of "Michael"
addNameVariations("michael", ["mike", "mikel", "micheal", "mikael"]);
// ✅ Added 4 variations for "michael"
```

---

### 4. `getAllCorrections()`

See all current corrections.

```typescript
import { getAllCorrections } from "@/lib/wordCorrection";

const corrections = getAllCorrections();
console.log(corrections);
// {
//   'geisha': 'jenisha',
//   'geesha': 'jenisha',
//   'sara': 'sarah',
//   ...
// }
```

---

### 5. `hasCorrection(word)`

Check if a word has a correction.

```typescript
import { hasCorrection } from "@/lib/wordCorrection";

if (hasCorrection("geisha")) {
  console.log('Yes, "geisha" will be corrected');
}
```

---

### 6. `removeCorrection(word)`

Remove a correction if no longer needed.

```typescript
import { removeCorrection } from "@/lib/wordCorrection";

removeCorrection("geisha");
// ❌ Removed correction: geisha
```

---

## 🎓 Complete Example: Adding Your Team's Names

### Scenario: You have a team of 5 people

```typescript
// File: src/lib/wordCorrection.ts

export const wordCorrections: Record<string, string> = {
  // === TEAM NAMES ===

  // Jenisha Dsouza
  geisha: "jenisha",
  geesha: "jenisha",
  gaisha: "jenisha",
  genisha: "jenisha",
  dsousa: "dsouza",
  "d'souza": "dsouza",

  // Priya Sharma
  prya: "priya",
  priyaa: "priya",
  sharma: "sharma",
  sharme: "sharma",
  sharmaa: "sharma",

  // Rahul Verma
  raul: "rahul",
  rahull: "rahul",
  verma: "verma",
  verma: "verma",
  vurma: "verma",

  // Sarah Johnson
  sara: "sarah",
  sarra: "sarah",
  johnson: "johnson",
  jonson: "johnson",
  jhonson: "johnson",

  // Michael Chen
  mike: "michael",
  mikel: "michael",
  micheal: "michael",
  chen: "chen",
  chan: "chen",
  chenn: "chen",
};
```

---

## 📊 Real-World Usage Examples

### Example 1: User introduces themselves

**What backend sends:**

```
"hi i am geisha dsousa"
```

**What gets corrected automatically:**

```
"hi i am jenisha dsouza" ✅
```

**Corrections applied:**

- `geisha` → `jenisha`
- `dsousa` → `dsouza`

---

### Example 2: Multiple names in sentence

**What backend sends:**

```
"jon and sara are friends with mike"
```

**What gets corrected automatically:**

```
"john and sarah are friends with michael" ✅
```

**Corrections applied:**

- `jon` → `john`
- `sara` → `sarah`
- `mike` → `michael`

---

### Example 3: Grammar correction doesn't break names

**User signs:**

```
"jenisha is here"
```

**User clicks "Fix Grammar":**

1. LanguageTool might change it: `"geisha is here"`
2. Word correction fixes it back: `"jenisha is here"` ✅

**Result:** Name stays correct! 🎉

---

## 🚀 Advanced: Bulk Import from File

If you have many names, create a separate file:

### File: `src/lib/nameDatabase.ts`

```typescript
import { addMultipleCorrections } from "./wordCorrection";

// All team members
const teamNames = {
  // Team 1
  geisha: "jenisha",
  geesha: "jenisha",
  gaisha: "jenisha",

  sara: "sarah",
  sarra: "sarah",

  mike: "michael",
  mikel: "michael",
};

// All clients
const clientNames = {
  rob: "robert",
  dave: "david",
  jon: "john",
};

// All common words
const commonWords = {
  watter: "water",
  helloo: "hello",
  thx: "thanks",
  plz: "please",
};

// Load all corrections on app start
export function loadAllCorrections() {
  addMultipleCorrections(teamNames);
  addMultipleCorrections(clientNames);
  addMultipleCorrections(commonWords);

  console.log("✅ All corrections loaded!");
}
```

### Then in `src/main.tsx`:

```typescript
import { loadAllCorrections } from "./lib/nameDatabase";

// Load corrections on app start
loadAllCorrections();

// Rest of your app...
```

---

## 🔍 Debugging: How to Find What Needs Correction

### 1. Check Browser Console

When corrections are applied, you'll see logs:

```
Word corrections applied:
  geisha → jenisha
  sara → sarah
  mike → michael
```

---

### 2. Watch WebSocket Messages

Add this to `src/pages/Index.tsx`:

```typescript
ws.onmessage = (ev) => {
  const data = JSON.parse((ev as MessageEvent).data);
  if (data?.type === "prediction") {
    const original = data.data?.sentence || "";
    const corrected = correctSentence(original);

    if (original !== corrected) {
      console.log("🔧 Correction needed:");
      console.log("  Backend sent:", original);
      console.log("  Corrected to:", corrected);
    }
  }
};
```

---

### 3. Create a Test Page

```typescript
// src/pages/TestCorrections.tsx
import { correctWord, getAllCorrections } from "@/lib/wordCorrection";

export function TestCorrections() {
  const testWords = ["geisha", "sara", "mike", "jon", "rahul"];

  return (
    <div>
      <h2>Test Word Corrections</h2>
      {testWords.map((word) => (
        <div key={word}>
          {word} → {correctWord(word)}
        </div>
      ))}

      <h3>All Corrections:</h3>
      <pre>{JSON.stringify(getAllCorrections(), null, 2)}</pre>
    </div>
  );
}
```

---

## 📋 Checklist: Adding a New Name

- [ ] Identify the wrong spelling from backend
- [ ] Determine the correct spelling
- [ ] Add to `wordCorrections` dictionary (all lowercase)
- [ ] Add common variations (e.g., 'sara', 'sarra' for 'sarah')
- [ ] Test by signing the name
- [ ] Check browser console for corrections
- [ ] Test with "Fix Grammar" button
- [ ] Verify name stays correct after grammar check

---

## 💡 Pro Tips

### Tip 1: Use All Lowercase in Dictionary

```typescript
// ✅ CORRECT
'geisha': 'jenisha',  // All lowercase

// ❌ WRONG
'Geisha': 'Jenisha',  // Capitalized (won't work!)
```

The `correctWord()` function handles capitalization automatically.

---

### Tip 2: Add Phonetic Variations

Think about how the name sounds:

```typescript
// Jenisha
'geisha': 'jenisha',   // Sounds like
'geesha': 'jenisha',   // Double 'e'
'gaisha': 'jenisha',   // 'a' instead of 'e'
'genisha': 'jenisha',  // Without 'j'
'jennisha': 'jenisha', // Double 'n'
```

---

### Tip 3: Include Common Typos

```typescript
// Sarah
'sara': 'sarah',     // Missing 'h'
'sarra': 'sarah',    // Double 'r'
'sahra': 'sarah',    // Swapped 'ah'
'sarha': 'sarah',    // Wrong order
```

---

### Tip 4: Test with Real Users

Ask team members to sign their names and note corrections needed.

---

## 🎯 Summary

| Method                       | When to Use              | Example                        |
| ---------------------------- | ------------------------ | ------------------------------ |
| **Direct Dictionary Edit**   | Permanent names/words    | Edit `wordCorrections` object  |
| **addCorrection()**          | Single addition          | `addCorrection('jon', 'john')` |
| **addMultipleCorrections()** | Batch additions          | Add 5+ names at once           |
| **addNameVariations()**      | One name, many spellings | All variations of "Sarah"      |

**Key Points:**

- ✅ Always use lowercase in dictionary
- ✅ Add phonetic variations
- ✅ Test with grammar correction
- ✅ Check browser console for logs
- ✅ Names are preserved at both WebSocket and grammar stages

---

## 📞 Need Help?

**Common Issues:**

1. **Name not being corrected?**

   - Check if it's lowercase in dictionary
   - Verify exact spelling from backend
   - Check browser console logs

2. **Grammar undoing corrections?**

   - This is fixed! Word corrections run AFTER grammar
   - Check console for "Word corrections applied after grammar check"

3. **Want to add many names?**
   - Use `addMultipleCorrections()`
   - Or create `nameDatabase.ts` file

**Happy correcting! 🎉**
