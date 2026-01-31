import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { SnackbarProvider } from "notistack";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SnackbarProvider
      maxSnack={3}
      autoHideDuration={3000}
    >
      <App />
    </SnackbarProvider>
  </StrictMode>
);

//! TODO:
/**
 * Fix Visualizer on uptuning/downtuning. 
 * 
 * Speed up / speed down
 * Song time on canvas hover
 * Mute / Unmute
 * Volume, Panner knobs
 * compression, distortion, EQ
 * use AI to remove certain instruments?
 * 
 */