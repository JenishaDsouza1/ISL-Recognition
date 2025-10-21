// Live Translation Test - Numbers and Greetings
// Run this in your browser console to see actual results!

console.log("🧪 Testing Translation: Numbers and Greetings\n");

const tests = [
  // Greetings
  { text: "Good morning", from: "en", to: "hi", category: "Greeting" },
  { text: "Good afternoon", from: "en", to: "hi", category: "Greeting" },
  { text: "Good evening", from: "en", to: "hi", category: "Greeting" },
  { text: "Good night", from: "en", to: "hi", category: "Greeting" },
  { text: "Hello", from: "en", to: "hi", category: "Greeting" },
  { text: "Thank you", from: "en", to: "hi", category: "Greeting" },

  // Numbers (spelled out)
  { text: "one", from: "en", to: "hi", category: "Number" },
  { text: "two", from: "en", to: "hi", category: "Number" },
  { text: "three", from: "en", to: "hi", category: "Number" },
  { text: "five", from: "en", to: "hi", category: "Number" },
  { text: "ten", from: "en", to: "hi", category: "Number" },

  // Numbers in sentences
  {
    text: "I have five apples",
    from: "en",
    to: "hi",
    category: "Sentence with Number",
  },
  {
    text: "I am twenty years old",
    from: "en",
    to: "hi",
    category: "Sentence with Number",
  },

  // Reverse (Hindi to English)
  { text: "सुप्रभात", from: "hi", to: "en", category: "Greeting (Hi→En)" },
  { text: "धन्यवाद", from: "hi", to: "en", category: "Greeting (Hi→En)" },
  { text: "एक", from: "hi", to: "en", category: "Number (Hi→En)" },
  { text: "पांच", from: "hi", to: "en", category: "Number (Hi→En)" },
];

// Test with Google Translate
async function testGoogleTranslate() {
  console.log("📊 GOOGLE TRANSLATE RESULTS:\n");
  console.log("═══════════════════════════════════════════════════════════\n");

  for (const test of tests) {
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${
        test.from
      }&tl=${test.to}&dt=t&q=${encodeURIComponent(test.text)}`;
      const response = await fetch(url);
      const data = await response.json();
      const translation = data[0]
        .map((item) => item[0])
        .filter((text) => text)
        .join("");

      console.log(`[${test.category}]`);
      console.log(`Original (${test.from}): ${test.text}`);
      console.log(`Translated (${test.to}): ${translation}`);
      console.log(
        "─────────────────────────────────────────────────────────\n"
      );

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (error) {
      console.error(`❌ Failed: ${test.text}`, error.message);
    }
  }

  console.log("✅ Google Translate testing complete!\n");
}

// Test with MyMemory
async function testMyMemory() {
  console.log("\n📊 MYMEMORY RESULTS:\n");
  console.log("═══════════════════════════════════════════════════════════\n");

  for (const test of tests) {
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        test.text
      )}&langpair=${test.from}|${test.to}`;
      const response = await fetch(url);
      const data = await response.json();
      const translation = data.responseData.translatedText;

      console.log(`[${test.category}]`);
      console.log(`Original (${test.from}): ${test.text}`);
      console.log(`Translated (${test.to}): ${translation}`);
      console.log(
        "─────────────────────────────────────────────────────────\n"
      );

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (error) {
      console.error(`❌ Failed: ${test.text}`, error.message);
    }
  }

  console.log("✅ MyMemory testing complete!\n");
}

// Run tests
console.log("⏳ Starting tests... (this will take ~30 seconds)\n");

testGoogleTranslate()
  .then(() => testMyMemory())
  .then(() => {
    console.log("\n🎉 All tests complete!");
    console.log("\nCompare the results above to see:");
    console.log("- How numbers are translated");
    console.log("- How greetings are translated");
    console.log("- Differences between Google and MyMemory");
  })
  .catch((error) => {
    console.error("❌ Test failed:", error);
  });
