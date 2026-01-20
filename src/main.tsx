import React from 'react';
import ReactDOM from 'react-dom/client';
import App from "./App.tsx";
import "./index.css";

// Safe DOM access with proper null guards
const rootElement = document.getElementById("root");
if (rootElement) {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<App />);
  } catch (error) {
    console.error('Failed to render React app:', error);
    // Fallback rendering for critical errors
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: system-ui;">
        <h1>Application Error</h1>
        <p>Unable to load the application. Please refresh the page.</p>
        <button onclick="window.location.reload()" style="padding: 10px 20px; margin-top: 10px;">
          Refresh Page
        </button>
      </div>
    `;
  }
} else {
  console.error('Root element not found');
}
