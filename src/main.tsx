import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Load word correction tester in development mode
if (import.meta.env.DEV) {
  import('./lib/wordCorrectionTester').then(module => {
    (window as any).WordTester = module.WordCorrectionTester;
    console.log('💡 Word Correction Tester loaded!');
    console.log('Use "WordTester" in console to test corrections.');
    console.log('Examples:');
    console.log('  WordTester.testCommonNames()');
    console.log('  WordTester.testWords(["geisha", "sara", "mike"])');
    console.log('  WordTester.testSentence("hi i am geisha")');
    console.log('  WordTester.showAllCorrections()');
  });
}

createRoot(document.getElementById("root")!).render(<App />);
