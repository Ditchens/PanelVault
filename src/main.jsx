import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker and auto-reload when a new version activates.
// On iOS PWAs, closing and reopening restores from snapshot without a page load,
// so the old JS keeps running even after SW updates. Listening for controllerchange
// catches when the new SW takes over and forces a fresh load.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").then((reg) => {
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "activated") {
            window.location.reload();
          }
        });
      });
    }).catch((err) => {
      console.warn("Service worker registration failed:", err);
    });

    // Also reload if controller changes (another tab triggered the update)
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });
  });
}
