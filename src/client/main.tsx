import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { Toaster } from './components/ui/sonner.tsx';
import '../index.css'; // Adjust path if needed

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster theme="dark" position="top-center" richColors />
  </StrictMode>,
);
