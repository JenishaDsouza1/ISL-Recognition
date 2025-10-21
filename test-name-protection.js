// Test Name Protection Feature
// Paste this in browser console to test the fix for "Jenisha" → "Geisha" issue

console.log("🧪 Testing Name Protection Feature\n");
console.log("═══════════════════════════════════════════════════════\n");

const tests = [
  // Basic name tests
  { text: "hi Jenisha", expected: 'should preserve "Jenisha"' },
  { text: "hello Jenisha", expected: 'should preserve "Jenisha"' },
  { text: "thank you Jenisha", expected: 'should preserve "Jenisha"' },
  { text: "good morning Jenisha", expected: 'should preserve "Jenisha"' },

  // Sentence tests
  { text: "Jenisha is learning", expected: 'should preserve "Jenisha"' },
  { text: "my name is Jenisha", expected: 'should preserve "Jenisha"' },
  { text: "Jenisha is happy", expected: 'should preserve "Jenisha"' },

  // Multiple names
  { text: "Jenisha and Rahul", expected: "should preserve both names" },
  { text: "hi Jenisha and Sarah", expected: "should preserve all names" },

  // Lowercase (should NOT be protected - demonstration)
  { text: "hi jenisha", expected: 'WARNING: lowercase may become "geisha"' },
];

async function testNameProtection() {
  console.log("🔄 Testing with Google Translate...\n");

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

      // Check if "Jenisha" is preserved
      const hasJenisha =
        translation.includes("Jenisha") || translation.includes("jenisha");
      const hasGeisha =
        translation.toLowerCase().includes("geisha") ||
        translation.includes("गीशा");

      const status = hasJenisha
        ? "✅ PASS"
        : hasGeisha
        ? "❌ FAIL (became geisha)"
        : "⚠️ CHECK";

      console.log(`${status}`);
      console.log(`Input:  "${test.text}"`);
      console.log(`Output: "${translation}"`);
      console.log(`Note:   ${test.expected}`);
      console.log("─────────────────────────────────────────────────────");

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`❌ Error testing: ${test.text}`, error.message);
    }
  }

  console.log("\n✅ Test complete!");
  console.log("\n📊 Summary:");
  console.log('- Capitalized "Jenisha" should remain as "Jenisha"');
  console.log('- Lowercase "jenisha" may become "geisha" (this is expected)');
  console.log("- Always capitalize proper names!");
}

// Note: This tests the EXTERNAL API behavior
// The actual protection happens in your app's translate.ts file
console.log("⚠️ NOTE: This tests raw Google Translate API");
console.log("Your app adds name protection on top of this!\n");

testNameProtection();
