import React from 'react';
import ReactDOM from 'react-dom/client';
import App from "./App.tsx";
import "./index.css";

console.log('%c🚀 Job Orbit Starting...', 'color: #667eea; font-size: 16px; font-weight: bold');
console.log('📋 Environment:', import.meta.env.MODE);
console.log('⏰ Timestamp:', new Date().toISOString());

// Safe DOM access with proper null guards
const rootElement = document.getElementById("root");
console.log('🔍 Root element found:', !!rootElement);

if (rootElement) {
  try {
    console.log('📦 Creating React root...');
    const root = ReactDOM.createRoot(rootElement);
    
    console.log('🎨 Rendering App component...');
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    console.log('%c✅ App rendered successfully!', 'color: #22c55e; font-size: 14px; font-weight: bold');
  } catch (error) {
    console.error('%c❌ Failed to render React app', 'color: #ef4444; font-size: 14px; font-weight: bold', error);
    console.error('Error details:', error instanceof Error ? error.stack : String(error));
    
    // Fallback rendering for critical errors
    const fallbackHTML = `
      <div style="padding: 40px 20px; text-align: center; font-family: system-ui; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center;">
        <div style="background: white; padding: 40px; border-radius: 12px; max-width: 500px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
          <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
          <h1 style="margin: 0 0 10px 0; font-size: 24px; color: #1f2937;">Application Error</h1>
          <p style="margin: 0 0 20px 0; color: #6b7280;">Unable to load the application. Check console for details.</p>
          <p style="margin: 0 0 20px 0; color: #ef4444; font-size: 14px; font-family: monospace; white-space: pre-wrap; text-align: left; background: #f3f4f6; padding: 10px; border-radius: 6px;">${error instanceof Error ? error.message : String(error)}</p>
          <button onclick="window.location.reload()" style="padding: 10px 20px; margin-top: 10px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">
            Refresh Page
          </button>
        </div>
      </div>
    `;
    rootElement.innerHTML = fallbackHTML;
  }
} else {
  console.error('%c❌ Root element not found in DOM', 'color: #ef4444; font-size: 14px; font-weight: bold');
  document.body.innerHTML = `
    <div style="padding: 40px 20px; text-align: center; font-family: system-ui; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center;">
      <div style="background: white; padding: 40px; border-radius: 12px; max-width: 500px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
        <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
        <h1 style="margin: 0 0 10px 0; font-size: 24px; color: #1f2937;">Fatal Error</h1>
        <p style="margin: 0 0 20px 0; color: #6b7280;">Root element (#root) not found in HTML</p>
        <p style="margin: 0 0 20px 0; color: #6b7280; font-size: 14px;">This is a configuration issue with the HTML file.</p>
      </div>
    </div>
  `;
}
