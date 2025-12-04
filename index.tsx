import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log('🚀 Budgetura: index.tsx loaded');

// Clean up localStorage if it's causing quota issues
try {
  // Check if localStorage is accessible and not full
  const testKey = '__storage_test__';
  localStorage.setItem(testKey, 'test');
  localStorage.removeItem(testKey);
} catch (e) {
  // localStorage is full or inaccessible
  console.warn('localStorage quota exceeded, clearing old data...');
  try {
    // Try to clear specific keys that might be too large
    const keysToCheck: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) keysToCheck.push(key);
    }

    // Remove items that are too large (> 100KB)
    keysToCheck.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        if (value && value.length > 100000) {
          console.warn(`Removing large localStorage item: ${key} (${value.length} chars)`);
          localStorage.removeItem(key);
        }
      } catch (err) {
        console.error(`Error checking ${key}:`, err);
      }
    });
  } catch (clearError) {
    // If we can't even iterate, just clear everything
    console.error('Critical localStorage error, clearing all data:', clearError);
    localStorage.clear();
  }
}

// We use a specific ID 'Budgetura-root' to avoid conflicts with other WP themes/plugins
const rootElement = document.getElementById('Budgetura-root');

if (!rootElement) {
  console.error("❌ ERROR: Could not find root element 'Budgetura-root' to mount to.");
  document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;"><div style="text-align:center;"><h1 style="color:red;">Error</h1><p>Could not find root element to mount app.</p></div></div>';
} else {
  console.log('✅ Root element found, mounting React app...');
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log('✅ React app rendered successfully');
  } catch (error) {
    console.error('❌ Error rendering React app:', error);
    rootElement.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;"><div style="text-align:center;"><h1 style="color:red;">Rendering Error</h1><p>Failed to render application. Check console for details.</p></div></div>';
  }
}