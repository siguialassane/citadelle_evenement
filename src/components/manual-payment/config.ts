
// Ce fichier contient les constantes et configurations pour le paiement manuel
// Mise à jour: Séparation claire des deux services EmailJS avec leurs templates et clés respectifs

// Définition des constantes
export const PAYMENT_AMOUNT = 1000; // Montant fixé à 1000 XOF

// ==================== CONFIGURATION EMAILJS: PREMIER SERVICE ====================
// Service pour les emails initiaux et notifications admin lors de la soumission
export const EMAILJS_SERVICE_ID = "service_sxgma2j";
export const EMAILJS_PUBLIC_KEY = "pWG3H0YqA-EKu4hqC";

// Templates pour le premier service
export const PARTICIPANT_INITIAL_TEMPLATE_ID = "template_2ncsaxe"; // Email initial (en attente)
export const ADMIN_NOTIFICATION_TEMPLATE_ID = "template_dp1tu2w"; // Notification admin

// ==================== CONFIGURATION EMAILJS: SECOND SERVICE ====================
// Service pour les emails de confirmation après validation admin
export const CONFIRMATION_EMAILJS_SERVICE_ID = "service_is5645q";
export const CONFIRMATION_EMAILJS_PUBLIC_KEY = "j9nKf3IoZXvL8mSae";

// Templates pour le second service
export const CONFIRMATION_TEMPLATE_ID = "template_xvdr1iq"; // Confirmation avec QR code
export const ADMIN_CONFIRMATION_NOTIFICATION_TEMPLATE_ID = "template_dwx7qnw"; // Notification admin post-confirmation

// Email de l'administrateur
export const ADMIN_EMAIL = "siguialassane93@gmail.com";

// Numéros de paiement
export const PAYMENT_NUMBERS = {
  MTN: "0503002817",
  MOOV: "0140229857",
  WAVE: "0503002817" // Même que MTN
};
