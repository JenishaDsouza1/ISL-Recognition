// Simple test to verify LanguageTool API is working
// Run this in browser console to test

async function testLanguageTool() {
  console.log("Testing LanguageTool API...");

  const formData = new URLSearchParams();
  formData.append("text", "I goed to the store yesterday");
  formData.append("language", "en-US");

  try {
    const response = await fetch("https://api.languagetool.org/v2/check", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const result = await response.json();
    console.log("✅ LanguageTool API is working!");
    console.log("Matches found:", result.matches.length);
    console.log(
      "Suggestions:",
      result.matches.map((m) => ({
        error: m.message,
        suggestions: m.replacements.map((r) => r.value),
      }))
    );

    return result;
  } catch (error) {
    console.error("❌ LanguageTool API failed:", error);
    return null;
  }
}

// Run test
testLanguageTool();
