import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Buffer } from "buffer";

// Buffer polyfill for Solana web3.js compatibility
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
  (window as any).global = window;
}

createRoot(document.getElementById("root")!).render(<App />);
