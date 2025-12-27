import React from "react";
// Vercel build trigger test: 2025-12-27
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "./lib/i18n"; // Initialize i18n

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
