import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

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