
// Ce fichier contient les constantes et configurations pour le paiement manuel
// Mise à jour: Un seul service EmailJS pour tous les emails
// Mise à jour: 2 templates - admin (notification) et participant (dynamique)

// Définition des constantes
export const PAYMENT_AMOUNT = 30000; // Montant fixé à 30000 XOF

// Service EmailJS unique pour TOUS les emails
export const EMAILJS_SERVICE_ID = "service_xt9q709";
export const EMAILJS_PUBLIC_KEY = "xzpEEppsuAiB9Ktop";

// Template admin - notification de nouvelle inscription
// Params EmailJS: {{{email_admin}}}, {{subject}}
// L'email destinataire admin est configuré directement dans EmailJS
export const ADMIN_NOTIFICATION_TEMPLATE_ID = "template_oz843jo";

// Template participant - utilisé pour inscription, validation ET rejet
// Params EmailJS: {{{email_participant}}}, {{to_email}}, {{subject}}
// Le contenu HTML de {{{email_participant}}} est généré dynamiquement
export const PARTICIPANT_TEMPLATE_ID = "template_3e5dq5i";

// Aliases pour compatibilité avec le reste du code
export const PARTICIPANT_INITIAL_TEMPLATE_ID = PARTICIPANT_TEMPLATE_ID;
export const CONFIRMATION_TEMPLATE_ID = PARTICIPANT_TEMPLATE_ID;
export const REJECTION_TEMPLATE_ID = PARTICIPANT_TEMPLATE_ID;
export const CONFIRMATION_EMAILJS_SERVICE_ID = EMAILJS_SERVICE_ID;
export const CONFIRMATION_EMAILJS_PUBLIC_KEY = EMAILJS_PUBLIC_KEY;
export const REJECTION_EMAILJS_SERVICE_ID = EMAILJS_SERVICE_ID;
export const REJECTION_EMAILJS_PUBLIC_KEY = EMAILJS_PUBLIC_KEY;

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
