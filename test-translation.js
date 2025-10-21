// Test Translation API in Browser Console
// Copy and paste this entire code block into your browser's console (F12)

console.log("🧪 Testing Translation APIs...\n");

// Test text
const testTextEn = "I am learning sign language";
const testTextHi = "मैं सांकेतिक भाषा सीख रहा हूं";

// Test 1: Google Translate (English → Hindi)
console.log("1️⃣ Testing Google Translate: English → Hindi");
fetch(
  `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q=${encodeURIComponent(
    testTextEn
  )}`
)
  .then((res) => res.json())
  .then((data) => {
    const translation = data[0]
      .map((item) => item[0])
      .filter((text) => text)
      .join("");
    console.log("✅ Google Translate works!");
    console.log("Original:", testTextEn);
    console.log("Translated:", translation);
    console.log("---\n");
  })
  .catch((err) => {
    console.error("❌ Google Translate failed:", err);
    console.log("---\n");
  });

// Test 2: Google Translate (Hindi → English)
console.log("2️⃣ Testing Google Translate: Hindi → English");
fetch(
  `https://translate.googleapis.com/translate_a/single?client=gtx&sl=hi&tl=en&dt=t&q=${encodeURIComponent(
    testTextHi
  )}`
)
  .then((res) => res.json())
  .then((data) => {
    const translation = data[0]
      .map((item) => item[0])
      .filter((text) => text)
      .join("");
    console.log("✅ Google Translate works!");
    console.log("Original:", testTextHi);
    console.log("Translated:", translation);
    console.log("---\n");
  })
  .catch((err) => {
    console.error("❌ Google Translate failed:", err);
    console.log("---\n");
  });

// Test 3: MyMemory (English → Hindi)
console.log("3️⃣ Testing MyMemory: English → Hindi");
fetch(
  `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
    testTextEn
  )}&langpair=en|hi`
)
  .then((res) => res.json())
  .then((data) => {
    console.log("✅ MyMemory works!");
    console.log("Original:", testTextEn);
    console.log("Translated:", data.responseData.translatedText);
    console.log("Match quality:", data.responseData.match);
    console.log("---\n");
  })
  .catch((err) => {
    console.error("❌ MyMemory failed:", err);
    console.log("---\n");
  });

// Test 4: MyMemory (Hindi → English)
console.log("4️⃣ Testing MyMemory: Hindi → English");
fetch(
  `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
    testTextHi
  )}&langpair=hi|en`
)
  .then((res) => res.json())
  .then((data) => {
    console.log("✅ MyMemory works!");
    console.log("Original:", testTextHi);
    console.log("Translated:", data.responseData.translatedText);
    console.log("Match quality:", data.responseData.match);
    console.log("---\n");
  })
  .catch((err) => {
    console.error("❌ MyMemory failed:", err);
    console.log("---\n");
  });

console.log("⏳ Tests running... Check results above when complete.");
