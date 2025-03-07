
// Ce fichier contient les constantes et configurations pour le paiement manuel

// Définition des constantes
export const PAYMENT_AMOUNT = 1000; // Montant fixé à 1000 XOF

// Configuration EmailJS pour le participant
export const EMAILJS_SERVICE_ID = "service_is5645q";
export const EMAILJS_TEMPLATE_ID = "template_dwx7qnw"; // Template standard

// Configuration EmailJS pour l'admin
export const ADMIN_EMAILJS_SERVICE_ID = "service_sxgma2j";
export const ADMIN_EMAILJS_TEMPLATE_ID = "template_dp1tu2w"; // Template admin
export const ADMIN_EMAILJS_PUBLIC_KEY = "pWG3H0YqA-EKu4hqC";
export const ADMIN_EMAIL = "siguialassane93@gmail.com";

// Numéros de paiement
export const PAYMENT_NUMBERS = {
  MTN: "0503002817",
  MOOV: "0140229857",
  WAVE: "0503002817" // Même que MTN
};
