import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log(`🎨 Frontend Deployed: ${new Date().toISOString()}`);

createRoot(document.getElementById("root")!).render(<App />);
