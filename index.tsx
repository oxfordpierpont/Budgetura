import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

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
  console.error("Could not find root element 'Budgetura-root' to mount to.");
} else {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}