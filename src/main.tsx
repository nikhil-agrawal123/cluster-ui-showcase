import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { runTriggerCheck } from "./lib/triggerCheck";

// Run trigger verification (output goes to browser console only)
runTriggerCheck();

createRoot(document.getElementById("root")!).render(<App />);
