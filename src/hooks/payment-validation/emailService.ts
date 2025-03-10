
// Service pour l'envoi d'emails de confirmation après validation des paiements
// Mise à jour: Correction du montant affiché à 30000 XOF
// Amélioration des URL de QR code avec paramètres plus robustes
// Mise à jour: Ajout du lien Google Maps pour la localisation de l'événement

import emailjs from '@emailjs/browser';
import { 
  CONFIRMATION_EMAILJS_SERVICE_ID, 
  CONFIRMATION_EMAILJS_PUBLIC_KEY,
  CONFIRMATION_TEMPLATE_ID,
  PAYMENT_AMOUNT,
  EVENT_LOCATION
} from "@/components/manual-payment/config";

/**
 * Envoie un email de confirmation au participant avec son QR code
 */
export const sendConfirmationEmail = async (participantData: any, qrCodeId: string): Promise<boolean> => {
  try {
    console.log("==== PRÉPARATION EMAIL DE CONFIRMATION AVEC QR CODE ====");
    
    if (!participantData.email) {
      console.error("Email du participant manquant");
      return false;
    }
    
    // URL de base et génération des liens
    const appUrl = window.location.origin;
    
    // AMÉLIORATION: URL de la page de confirmation avec paramètres supplémentaires
    // Ajout du type=qr pour indiquer que c'est un accès via QR code
    // Ajout du pid (participantId) pour la redirection si nécessaire
    const confirmationPageUrl = `${appUrl}/confirmation/${qrCodeId}?type=qr&pid=${participantData.id}`;
    console.log("URL de confirmation améliorée:", confirmationPageUrl);
    
    // Génération de l'URL pour l'image QR code avec encodage robuste
    const encodedConfirmationUrl = encodeURIComponent(confirmationPageUrl);
    // Paramètres optimisés: taille 300x300 et marge (qzone) de 2
    const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedConfirmationUrl}&qzone=2`;
    console.log("URL de l'image QR code générée (QR Server API):", qrCodeImageUrl);
    
    // URL du reçu avec l'ID du participant
    const receiptUrl = `${appUrl}/receipt/${participantData.id}`;
    
    // URL Google Maps pour la localisation de l'événement
    const eventLocationUrl = EVENT_LOCATION.mapsUrl;
    console.log("URL de localisation Google Maps:", eventLocationUrl);
    
    const formattedDate = new Date().toLocaleDateString('fr-FR');
    
    console.log("QR Code ID:", qrCodeId);
    console.log("Participant ID:", participantData.id);
    console.log("URL de la page de confirmation:", confirmationPageUrl);
    console.log("URL de l'image QR code:", qrCodeImageUrl);
    console.log("URL du reçu:", receiptUrl);
    console.log("URL de localisation:", eventLocationUrl);
    console.log("Email du participant:", participantData.email);
    console.log("Montant corrigé du paiement:", `${PAYMENT_AMOUNT} XOF`);
    
    // Déterminer le statut du participant
    const status = participantData.is_member ? "Membre" : "Non-membre";
    
    // Préparation des paramètres de l'email - ajustés pour correspondre au template
    const confirmationParams = {
      to_email: participantData.email.trim(),
      prenom: participantData.first_name,
      nom: participantData.last_name,
      participant_name: `${participantData.first_name} ${participantData.last_name}`,
      participant_phone: participantData.contact_number,
      from_name: "IFTAR 2024",
      payment_amount: `${PAYMENT_AMOUNT} XOF`, // Montant corrigé
      status: status,
      qr_code_url: qrCodeImageUrl, // URL de l'image QR code pour la balise <img>
      confirmation_url: confirmationPageUrl, // URL directe pour accéder à la page de confirmation
      receipt_url: receiptUrl, // URL pour télécharger le reçu
      confirmation_date: formattedDate,
      app_url: appUrl,
      maps_url: eventLocationUrl, // URL Google Maps
      event_location: EVENT_LOCATION.name, // Nom du lieu
      event_address: EVENT_LOCATION.address, // Adresse complète
      reply_to: "ne-pas-repondre@lacitadelle.ci"
    };
    
    console.log("Envoi de l'email de confirmation avec QR code - paramètres:", confirmationParams);
    console.log("Service EmailJS dédié à la confirmation:", CONFIRMATION_EMAILJS_SERVICE_ID);
    console.log("Template confirmation:", CONFIRMATION_TEMPLATE_ID);
    console.log("Clé publique dédiée:", CONFIRMATION_EMAILJS_PUBLIC_KEY);
    
    // Envoi de l'email de confirmation avec le service dédié
    const response = await emailjs.send(
      CONFIRMATION_EMAILJS_SERVICE_ID,
      CONFIRMATION_TEMPLATE_ID, // Utilisation unique de ce template pour la confirmation
      confirmationParams,
      CONFIRMATION_EMAILJS_PUBLIC_KEY
    );
    
    console.log("Email de confirmation envoyé avec succès:", response);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de confirmation:", error);
    console.error("Détails de l'erreur:", error);
    return false;
  }
};
