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
//! BUGS
/**
 * User markers messing up when zooming in/out
 * Second user marker doesnt reset when just clicking on the canvas
 */