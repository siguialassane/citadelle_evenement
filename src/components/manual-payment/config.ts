
// Ce fichier contient les constantes et configurations pour le paiement manuel

// Définition des constantes
export const PAYMENT_AMOUNT = 1000; // Montant fixé à 1000 XOF

// ==================== PREMIÈRE API (EMAILS INITIAUX) ====================
// Pour l'email initial envoyé au participant et l'email de notification à l'admin

// Configuration EmailJS pour le participant - Email initial (en attente de validation)
export const INITIAL_EMAILJS_SERVICE_ID = "service_is5645q";
export const INITIAL_EMAILJS_TEMPLATE_ID = "template_dwx7qnw"; // Template pour notification initiale
export const INITIAL_EMAILJS_PUBLIC_KEY = "j9nKf3IoZXvL8mSae";

// Configuration EmailJS pour l'admin
export const ADMIN_EMAILJS_SERVICE_ID = "service_sxgma2j";
export const ADMIN_EMAILJS_TEMPLATE_ID = "template_dp1tu2w"; // Template admin
export const ADMIN_EMAILJS_PUBLIC_KEY = "j9nKf3IoZXvL8mSae";
export const ADMIN_EMAIL = "siguialassane93@gmail.com";

// ==================== DEUXIÈME API (EMAIL DE CONFIRMATION) ====================
// Pour l'email de confirmation avec QR code envoyé APRÈS validation par l'admin

export const CONFIRMATION_EMAILJS_SERVICE_ID = "service_is5645q";
export const CONFIRMATION_EMAILJS_TEMPLATE_ID = "template_xvdr1iq"; // Template avec QR code
export const CONFIRMATION_EMAILJS_PUBLIC_KEY = "j9nKf3IoZXvL8mSae";

// Numéros de paiement
export const PAYMENT_NUMBERS = {
  MTN: "0503002817",
  MOOV: "0140229857",
  WAVE: "0503002817" // Même que MTN
};
