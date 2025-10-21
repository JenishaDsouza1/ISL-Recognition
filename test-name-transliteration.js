// Test Name Transliteration (Names in Hindi Script)
// This shows how "Jenisha" will be converted to Hindi: "जेनिशा"

console.log("🧪 Testing Name Transliteration to Hindi Script\n");
console.log("═══════════════════════════════════════════════════════════\n");

const tests = [
  // Names with greetings
  { text: "hi Jenisha", expected: "हाय/नमस्ते जेनिशा" },
  { text: "hello Jenisha", expected: "नमस्ते जेनिशा" },
  { text: "good morning Jenisha", expected: "सुप्रभात जेनिशा" },
  { text: "thank you Jenisha", expected: "धन्यवाद जेनिशा" },

  // Names in sentences
  { text: "Jenisha is learning", expected: "जेनिशा सीख रहा/रही है" },
  { text: "my name is Jenisha", expected: "मेरा नाम जेनिशा है" },
  { text: "Jenisha is happy", expected: "जेनिशा खुश है" },
  { text: "I am Jenisha", expected: "मैं जेनिशा हूं" },

  // Multiple names
  { text: "Jenisha and Rahul", expected: "जेनिशा और राहुल" },
  { text: "Jenisha and Sarah", expected: "जेनिशा और सारा" },

  // Other common names
  { text: "hello Rahul", expected: "नमस्ते राहुल" },
  { text: "hi Priya", expected: "हाय प्रिया" },
  { text: "thank you Amit", expected: "धन्यवाद अमित" },
];

async function testTransliteration() {
  console.log("📊 GOOGLE TRANSLATE - Name Transliteration Results:\n");

  for (const test of tests) {
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q=${encodeURIComponent(
        test.text
      )}`;
      const response = await fetch(url);
      const data = await response.json();
      const translation = data[0]
        .map((item) => item[0])
        .filter((text) => text)
        .join("");

      // Check if name is in Hindi script
      const hasHindiScript = /[\u0900-\u097F]/.test(translation);
      const hasEnglishLetters = /[A-Za-z]/.test(translation);

      let status = "✅ ";
      if (hasHindiScript && !hasEnglishLetters) {
        status = "✅ PERFECT (all Hindi)";
      } else if (hasHindiScript && hasEnglishLetters) {
        status = "⚠️ MIXED (Hindi + English)";
      } else {
        status = "❌ NO TRANSLITERATION";
      }

      console.log(status);
      console.log(`Input:    "${test.text}"`);
      console.log(`Output:   "${translation}"`);
      console.log(`Expected: "${test.expected}"`);
      console.log("─────────────────────────────────────────────────────────");

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`❌ Error testing: ${test.text}`, error.message);
    }
  }

  console.log("\n✅ Test complete!\n");
  console.log("📝 Key Findings:");
  console.log('- "Jenisha" should appear as "जेनिशा" (Hindi script)');
  console.log('- "Rahul" should appear as "राहुल"');
  console.log('- "Priya" should appear as "प्रिया"');
  console.log("- All names should be transliterated to Devanagari script");
}

// Show pronunciation guide
console.log("📖 Hindi Transliteration Examples:\n");
console.log("English → Hindi (Devanagari)");
console.log("───────────────────────────");
console.log("Jenisha → जेनिशा (je-ni-sha)");
console.log("Rahul   → राहुल (ra-hul)");
console.log("Priya   → प्रिया (pri-ya)");
console.log("Amit    → अमित (a-mit)");
console.log("Sarah   → सारा (sa-ra)");
console.log("");

testTransliteration();
