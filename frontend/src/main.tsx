import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log(`🎨 Frontend Deployed: ${new Date().toISOString()}`);
console.log('✅ Platform compatibility fix applied - Linux & macOS compatible');
console.log('📱 Frontend Version: 1.0.0');

createRoot(document.getElementById("root")!).render(<App />);
