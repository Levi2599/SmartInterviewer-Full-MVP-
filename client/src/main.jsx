// client/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global fetch interceptor to append JWT token
const originalFetch = window.fetch;
window.fetch = function (url, options = {}) {
  const token = localStorage.getItem('token');
  if (token) {
    options.headers = options.headers || {};
    options.headers['Authorization'] = `Bearer ${token}`;
  }
  return originalFetch(url, options);
};

// Keep-alive ping every 9 minutes to prevent Render free tier cold starts
setInterval(() => {
  originalFetch('/health').catch(() => {});
}, 9 * 60 * 1000);

// Ping immediately on load to wake the server early
originalFetch('/health').catch(() => {});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);