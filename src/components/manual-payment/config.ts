
// Ce fichier contient les constantes et configurations pour le paiement manuel
// Mise à jour: Suppression du template de notification admin après confirmation
// Correction: Paramètres alignés avec les templates utilisés
// Mise à jour: Nouveaux numéros de paiement et suppression de MTN
// Mise à jour: Montant modifié à 30000 XOF

// Définition des constantes
export const PAYMENT_AMOUNT = 30000; // Montant fixé à 30000 XOF

// ==================== CONFIGURATION EMAILJS SÉPARÉE ====================
// Service pour les emails initiaux et notifications administrateur (demandes en attente)
export const EMAILJS_SERVICE_ID = "service_sxgma2j";
export const EMAILJS_PUBLIC_KEY = "pWG3H0YqA-EKu4hqC";

// Service dédié pour les emails de confirmation après validation (avec QR code)
export const CONFIRMATION_EMAILJS_SERVICE_ID = "service_is5645q";
export const CONFIRMATION_EMAILJS_PUBLIC_KEY = "j9nKf3IoZXvL8mSae";

// Templates pour les différents types d'emails
export const PARTICIPANT_INITIAL_TEMPLATE_ID = "template_2ncsaxe"; // Email initial (en attente)
export const ADMIN_NOTIFICATION_TEMPLATE_ID = "template_dp1tu2w"; // Notification admin initiale
export const CONFIRMATION_TEMPLATE_ID = "template_xvdr1iq"; // Confirmation avec QR code

// Email de l'administrateur
export const ADMIN_EMAIL = "siguialassane93@gmail.com";

// Numéros de paiement
export const PAYMENT_NUMBERS = {
  ORANGE: "0759567966",
  MOOV: "0101011786",
  WAVE: "0759567966" // Même que ORANGE
};
