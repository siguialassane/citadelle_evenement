// Ce fichier contient les constantes et configurations pour le paiement manuel
// Mise à jour: Services EmailJS séparés pour confirmation et rejet
// Mise à jour: Correction des services et templates pour éviter les doublons d'envoi

// Définition des constantes
export const PAYMENT_AMOUNT = 30000; // Montant fixé à 30000 XOF

// Service UNIQUEMENT pour les emails initiaux et notifications admin
export const EMAILJS_SERVICE_ID = "service_sxgma2j";
export const EMAILJS_PUBLIC_KEY = "pWG3H0YqA-EKu4hqC";

// Service UNIQUEMENT pour les emails de confirmation (avec QR code)
export const CONFIRMATION_EMAILJS_SERVICE_ID = "service_is5645q";
export const CONFIRMATION_EMAILJS_PUBLIC_KEY = "j9nKf3IoZXvL8mSae";

// Service UNIQUEMENT pour les emails de rejet
export const REJECTION_EMAILJS_SERVICE_ID = "service_rm2toad";
export const REJECTION_EMAILJS_PUBLIC_KEY = "j9nKf3IoZXvL8mSae";

// Templates pour les différents types d'emails
export const PARTICIPANT_INITIAL_TEMPLATE_ID = "template_2ncsaxe"; // Email initial
export const ADMIN_NOTIFICATION_TEMPLATE_ID = "template_dp1tu2w"; // Notification admin
export const CONFIRMATION_TEMPLATE_ID = "template_xvdr1iq"; // QR code uniquement
export const REJECTION_TEMPLATE_ID = "template_dwx7qnw"; // Rejet uniquement

// Email de l'administrateur
export const ADMIN_EMAIL = "siguialassane93@gmail.com";

// Numéros de paiement
export const PAYMENT_NUMBERS = {
  ORANGE: "0759567966",
  MOOV: "0101011786",
  WAVE: "0759567966" // Même que ORANGE
};

// Localisation exacte de NOOM HOTEL PLATEAU
export const EVENT_LOCATION = {
  name: "NOOM HOTEL ABIDJAN PLATEAU",
  address: "8XFG+9H3, Boulevard de Gaulle, BP 7393, Abidjan",
  coordinates: {
    latitude: 5.323753,
    longitude: -4.015204
  },
  // Lien Google Maps avec l'adresse mise à jour
  mapsUrl: "https://www.google.com/maps?q=8XFG%2B9H3,+Boulevard+de+Gaulle,+BP+7393,+Abidjan"
};
