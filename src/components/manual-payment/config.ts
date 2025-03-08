
// Ce fichier contient les constantes et configurations pour le paiement manuel

// Définition des constantes
export const PAYMENT_AMOUNT = 1000; // Montant fixé à 1000 XOF

// Configuration EmailJS pour le participant - Email initial (en attente de validation)
export const EMAILJS_SERVICE_ID = "service_is5645q";
export const EMAILJS_TEMPLATE_ID = "template_dwx7qnw"; // Template pour notification initiale
export const EMAILJS_PUBLIC_KEY = "pWG3H0YqA-EKu4hqC"; // Clé publique pour EmailJS

// Configuration EmailJS pour l'admin
export const ADMIN_EMAILJS_SERVICE_ID = "service_sxgma2j";
export const ADMIN_EMAILJS_TEMPLATE_ID = "template_dp1tu2w"; // Template admin
export const ADMIN_EMAILJS_PUBLIC_KEY = "pWG3H0YqA-EKu4hqC";
export const ADMIN_EMAIL = "siguialassane93@gmail.com";

// Configuration spécifique pour les emails de confirmation au participant (après validation paiement)
export const PARTICIPANT_EMAILJS_SERVICE_ID = "service_is5645q";
export const PARTICIPANT_EMAILJS_TEMPLATE_ID = "template_dwx7qnw"; // Template pour email initial

// Template pour la confirmation après validation du paiement (avec QR code)
export const PAYMENT_CONFIRMATION_EMAILJS_SERVICE_ID = "service_is5645q";
export const PAYMENT_CONFIRMATION_EMAILJS_TEMPLATE_ID = "template_xvdr1iq"; // Template de confirmation avec QR code (corrigé)
export const PAYMENT_CONFIRMATION_EMAILJS_PUBLIC_KEY = "j9nKf3IoZXvL8mSae"; // Clé publique correcte

// Numéros de paiement
export const PAYMENT_NUMBERS = {
  MTN: "0503002817",
  MOOV: "0140229857",
  WAVE: "0503002817" // Même que MTN
};
