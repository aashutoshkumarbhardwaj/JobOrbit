import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const rootElement = typeof document !== 'undefined' ? document.getElementById("root") : null;
if (rootElement) {
  createRoot(rootElement).render(<App />);
}
