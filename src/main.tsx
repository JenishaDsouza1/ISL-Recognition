import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Dev helper removed: wordCorrectionTester module no longer exists
// If you need it again, restore src/lib/wordCorrectionTester.ts and re-add the import.

createRoot(document.getElementById("root")!).render(<App />);
