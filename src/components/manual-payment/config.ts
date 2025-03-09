
// Ce fichier contient les constantes et configurations pour le paiement manuel

// Définition des constantes
export const PAYMENT_AMOUNT = 1000; // Montant fixé à 1000 XOF

// ==================== EMAIL API #1 (EMAILS INITIAUX) ====================
// Pour les emails initiaux (participant en attente + notification admin)

// Service ID pour les emails initiaux (participant et admin)
export const INITIAL_EMAILJS_SERVICE_ID = "service_sxgma2j";
export const INITIAL_EMAILJS_PUBLIC_KEY = "pWG3H0YqA-EKu4hqC";

// Template pour l'email initial au participant (en attente de validation)
export const PARTICIPANT_INITIAL_TEMPLATE_ID = "template_2ncsaxe";

// Email et template pour l'administrateur
export const ADMIN_EMAIL = "siguialassane93@gmail.com";
export const ADMIN_NOTIFICATION_TEMPLATE_ID = "template_dp1tu2w";

// ==================== EMAIL API #2 (EMAIL DE CONFIRMATION) ====================
// Pour l'email de confirmation avec QR code après validation par l'admin

export const CONFIRMATION_EMAILJS_SERVICE_ID = "service_is5645q"; // Service pour l'email de confirmation
export const CONFIRMATION_EMAILJS_TEMPLATE_ID = "template_dwx7qnw"; // Template pour confirmation avec QR code
export const CONFIRMATION_EMAILJS_PUBLIC_KEY = "j9nKf3IoZXvL8mSae"; // Clé publique pour l'email de confirmation

// Numéros de paiement
export const PAYMENT_NUMBERS = {
  MTN: "0503002817",
  MOOV: "0140229857",
  WAVE: "0503002817" // Même que MTN
};
