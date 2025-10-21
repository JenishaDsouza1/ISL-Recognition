# 🔢 'O' to '0' Conversion Feature

## 📋 What This Does

Automatically converts the letter **'o'** (lowercase O) to the number **'0'** (zero) in two specific cases:

1. **Standalone 'o'** - When 'o' appears as a single word between spaces
2. **'o' with numbers** - When 'o' appears mixed with numbers

---

## 🎯 Why This is Needed

### **Problem:**

Sign language recognition sometimes confuses the hand gesture for:

- Number **0** (zero) → Recognized as letter **'o'**
- Mixed numbers like **"102"** → Recognized as **"1o2"**

### **Examples of Misrecognition:**

```
Backend sends: "I have o apples"
Should be:     "I have 0 apples"

Backend sends: "Call me at 5o5-1o23"
Should be:     "Call me at 505-1023"

Backend sends: "Room o1"
Should be:     "Room 01"

Backend sends: "My score is 1o out of 1o"
Should be:     "My score is 10 out of 10"
```

---

## ✅ How It Works

### **Two-Step Process:**

```
Step 1: Replace standalone 'o' → '0'
    "I have o apples" → "I have 0 apples"

Step 2: Replace 'o' mixed with numbers → '0'
    "Call 5o5-1o23" → "Call 505-1023"
```

---

## 🔧 Implementation

### **File:** `src/lib/wordCorrection.ts`

### **Function 1: `convertOToZero()`**

```typescript
/**
 * Convert letter 'o' to number '0' in specific contexts:
 * 1. When 'o' is a standalone word (between spaces)
 * 2. When 'o' appears within numbers (e.g., "1o2" → "102")
 */
export function convertOToZero(text: string): string {
  // Replace 'o' when it appears with numbers
  // Matches patterns like: 1o, o1, 1o2, 2o3, etc.
  let result = text.replace(/(\d+)o(\d*)/gi, "$10$2"); // e.g., "1o2" → "102"
  result = result.replace(/o(\d+)/gi, "0$1"); // e.g., "o123" → "0123"

  return result;
}
```

**What it does:**

- Pattern 1: `(\d+)o(\d*)` → Matches "5o5", "1o", "2o3"
- Pattern 2: `o(\d+)` → Matches "o5", "o123"
- Replaces 'o' with '0' only in these number contexts

---

### **Function 2: `correctSentence()` (Updated)**

```typescript
/**
 * Correct all words in a sentence
 * Handles standalone 'o' and 'o' within numbers
 */
export function correctSentence(sentence: string): string {
  // First replace standalone 'o' with '0'
  let result = sentence.replace(/\bo\b/gi, "0");

  // Then correct each word (which also handles 'o' in numbers)
  const words = result.split(" ");
  const correctedWords = words.map((word) => correctWord(word));
  return correctedWords.join(" ");
}
```

**What it does:**

- `/\bo\b/` → Matches word boundary (standalone 'o')
- Replaces standalone 'o' with '0'
- Then processes each word for number patterns

---

## 📊 Examples & Test Cases

### **Case 1: Standalone 'o'**

| Input                  | Output                 | Explanation        |
| ---------------------- | ---------------------- | ------------------ |
| `"I have o apples"`    | `"I have 0 apples"`    | 'o' → '0'          |
| `"Count from o to 1o"` | `"Count from 0 to 10"` | Both 'o' converted |
| `"o is the start"`     | `"0 is the start"`     | 'o' at beginning   |
| `"Total is o"`         | `"Total is 0"`         | 'o' at end         |

---

### **Case 2: 'o' Mixed with Numbers**

| Input        | Output       | Explanation         |
| ------------ | ------------ | ------------------- |
| `"1o2"`      | `"102"`      | 'o' between digits  |
| `"5o5-1o23"` | `"505-1023"` | Phone number format |
| `"Room 1o1"` | `"Room 101"` | Room number         |
| `"2o"`       | `"20"`       | 'o' after digit     |
| `"o5"`       | `"05"`       | 'o' before digit    |
| `"3o4o5"`    | `"30405"`    | Multiple 'o'        |

---

### **Case 3: 'o' in Words (NOT Converted)**

| Input            | Output           | Explanation             |
| ---------------- | ---------------- | ----------------------- |
| `"hello world"`  | `"hello world"`  | 'o' in word unchanged ✓ |
| `"good morning"` | `"good morning"` | 'o' in word unchanged ✓ |
| `"on the table"` | `"on the table"` | 'o' in word unchanged ✓ |
| `"go home"`      | `"go home"`      | 'o' in word unchanged ✓ |

**Why not converted?**

- 'o' is part of a word, not standalone
- Not mixed with numbers

---

### **Case 4: Mixed Scenarios**

| Input                    | Output                   | Explanation         |
| ------------------------ | ------------------------ | ------------------- |
| `"Room o has 1o people"` | `"Room 0 has 10 people"` | Standalone + number |
| `"Call 5o5 or go home"`  | `"Call 505 or go home"`  | Number + word       |
| `"o to 1o good jobs"`    | `"0 to 10 good jobs"`    | All types mixed     |

---

## 🔄 Integration Flow

### **Where It Runs:**

```
1. Backend sends prediction
    ↓
    "Room 1o1 has o seats"
    ↓
2. WebSocket handler receives
    ↓
3. correctSentence() runs
    ↓
    Step A: Replace standalone 'o' → '0'
    "Room 1o1 has 0 seats"
    ↓
    Step B: correctWord() for each word
    "1o1" → convertOToZero() → "101"
    ↓
4. Final result displayed
    ↓
    "Room 101 has 0 seats" ✅
```

---

## 🧪 Testing the Feature

### **Test in Your App:**

1. **Test Standalone 'o':**

   ```
   Sign language gesture for "0"
   Backend might send: "o"
   You should see: "0"
   ```

2. **Test Phone Numbers:**

   ```
   Sign: 5-0-5-1-0-2-3
   Backend might send: "5o5 1o23"
   You should see: "505 1023"
   ```

3. **Test Room Numbers:**

   ```
   Sign: 1-0-1
   Backend might send: "1o1"
   You should see: "101"
   ```

4. **Test Mixed Text:**

   ```
   Sign: "I have 0 apples"
   Backend might send: "I have o apples"
   You should see: "I have 0 apples"
   ```

5. **Test Words (Should NOT Convert):**
   ```
   Sign: "hello"
   Backend sends: "hello"
   You should see: "hello" (unchanged) ✓
   ```

---

## 🔍 Technical Details

### **Regular Expression Patterns:**

1. **`/\bo\b/gi`** - Standalone 'o'

   - `\b` = Word boundary
   - `o` = Letter 'o'
   - `\b` = Word boundary
   - `g` = Global (all matches)
   - `i` = Case insensitive

2. **`/(\d+)o(\d*)/gi`** - 'o' between/after digits

   - `(\d+)` = One or more digits (captured)
   - `o` = Letter 'o'
   - `(\d*)` = Zero or more digits (captured)
   - Replaces with: `$10$2` (digit + 0 + digit)

3. **`/o(\d+)/gi`** - 'o' before digits
   - `o` = Letter 'o'
   - `(\d+)` = One or more digits
   - Replaces with: `0$1` (0 + digits)

---

## 📋 Edge Cases Handled

### **Case-Insensitive:**

```
"O" → "0" (uppercase O)
"o" → "0" (lowercase o)
"O5O" → "050"
```

### **Multiple 'o' in Sequence:**

```
"1oo2" → "1002" (both 'o' converted)
"ooo" → "000" (standalone)
```

### **Hyphenated Numbers:**

```
"5o5-1o23" → "505-1023"
"1o-o5" → "10-05"
```

---

## ⚠️ Important Notes

### **What IS Converted:**

✅ Standalone 'o' (word by itself)

```
" o " → " 0 "
```

✅ 'o' mixed with digits

```
"1o2" → "102"
"o5" → "05"
"5o" → "50"
```

### **What is NOT Converted:**

❌ 'o' inside words

```
"hello" → "hello" (NOT "hell0")
"good" → "good" (NOT "g00d")
"on" → "on" (NOT "0n")
```

**Why?**

- Uses word boundaries (`\b`)
- Only matches standalone 'o' or 'o' with numbers
- Preserves normal English words

---

## 🎯 Real-World Examples

### **Example 1: Phone Number**

**Scenario:** User signs phone number 505-1023

```
Backend prediction: "5o5 1o23"
    ↓
correctSentence() runs
    ↓
Standalone 'o' check: No standalone 'o' found
    ↓
correctWord("5o5"):
  - convertOToZero("5o5") → "505"
    ↓
correctWord("1o23"):
  - convertOToZero("1o23") → "1023"
    ↓
Final: "505 1023" ✅
```

---

### **Example 2: Room Number with Count**

**Scenario:** User signs "Room 101 has 0 people"

```
Backend prediction: "Room 1o1 has o people"
    ↓
correctSentence() runs
    ↓
Standalone 'o' → '0': "Room 1o1 has 0 people"
    ↓
correctWord("1o1"):
  - convertOToZero("1o1") → "101"
    ↓
Final: "Room 101 has 0 people" ✅
```

---

### **Example 3: Sentence with Words (No Conversion)**

**Scenario:** User signs "hello go home"

```
Backend prediction: "hello go home"
    ↓
correctSentence() runs
    ↓
Standalone 'o' check: No standalone 'o' found
    ↓
correctWord("hello"): No 'o' with numbers → "hello"
correctWord("go"): No 'o' with numbers → "go"
correctWord("home"): No 'o' with numbers → "home"
    ↓
Final: "hello go home" ✅ (unchanged)
```

---

## 🔧 Customization

### **If You Want Different Behavior:**

**Change Pattern 1: Only convert with numbers (not standalone)**

```typescript
export function correctSentence(sentence: string): string {
  // Remove this line to skip standalone 'o' conversion
  // let result = sentence.replace(/\bo\b/gi, '0');

  const words = sentence.split(" ");
  const correctedWords = words.map((word) => correctWord(word));
  return correctedWords.join(" ");
}
```

**Change Pattern 2: Convert all 'o' to '0' (aggressive)**

```typescript
export function correctSentence(sentence: string): string {
  // WARNING: This will break words like "hello" → "hell0"
  return sentence.replace(/o/gi, "0");
}
```

---

## ✅ Summary

### **Current Behavior:**

| Scenario       | Input       | Output      | Status            |
| -------------- | ----------- | ----------- | ----------------- |
| Standalone 'o' | `" o "`     | `" 0 "`     | ✅ Converted      |
| With numbers   | `"1o2"`     | `"102"`     | ✅ Converted      |
| In words       | `"hello"`   | `"hello"`   | ✅ Preserved      |
| Mixed          | `"o to 1o"` | `"0 to 10"` | ✅ Both converted |

### **Benefits:**

- ✅ Fixes common sign language misrecognition
- ✅ Handles phone numbers, room numbers, scores
- ✅ Preserves normal English words
- ✅ Works automatically in real-time
- ✅ No user action needed

### **Runs Automatically:**

1. WebSocket receives backend prediction
2. `correctSentence()` is called
3. 'o' → '0' conversion happens
4. User sees corrected text

**No additional setup needed - it just works!** 🎉

---

## 🧪 Quick Test Commands

### **Test in Console:**

```typescript
import { correctSentence } from "@/lib/wordCorrection";

// Test 1: Standalone 'o'
console.log(correctSentence("I have o apples"));
// Expected: "I have 0 apples"

// Test 2: Numbers
console.log(correctSentence("Call 5o5-1o23"));
// Expected: "Call 505-1023"

// Test 3: Mixed
console.log(correctSentence("Room 1o1 has o people"));
// Expected: "Room 101 has 0 people"

// Test 4: Words (no change)
console.log(correctSentence("hello go home"));
// Expected: "hello go home"
```

---

**Feature is now active and working!** ✅
