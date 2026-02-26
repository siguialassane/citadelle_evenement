import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import emailjs from '@emailjs/browser';

// Initialisation EmailJS au démarrage de l'application
emailjs.init("xzpEEppsuAiB9Ktop");

createRoot(document.getElementById("root")!).render(<App />);
