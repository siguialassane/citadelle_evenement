
import emailjs from '@emailjs/browser';
import { validateEmailData, prepareEmailData } from './emailValidation';
import { EmailTemplateParams } from './types';
import { 
  REJECTION_EMAILJS_SERVICE_ID, 
  REJECTION_EMAILJS_PUBLIC_KEY,
  REJECTION_TEMPLATE_ID,
  PAYMENT_AMOUNT,
  EVENT_LOCATION
} from "../../config";

/**
 * Envoie un email de rejet au participant
 */
export const sendPaymentRejectionEmail = async (participantData: any, adminNotes: string = "") => {
  try {
    console.log("===== PRÉPARATION EMAIL DE REJET =====");
    
    // Valider les données du participant
    const validation = validateEmailData(participantData?.email, participantData);
    if (!validation.isValid) {
      console.error("Validation de l'email échouée:", validation.error);
      return false;
    }
    
    // Préparer l'email pour éviter les problèmes de formatage
    const email = prepareEmailData(participantData.email);
    
    // IMPORTANT: Ne PAS utiliser {{app_url}} mais construire l'URL complète ici
    const appUrl = window.location.origin;
    
    // Construction explicite des URLs pour éviter les problèmes de variables non remplacées
    const paymentUrl = `${appUrl}/payment/${participantData.id}`;
    
    // Formatage du statut de membre
    const memberStatus = participantData.is_member ? "Membre" : "Non membre";
    
    // Formatage des notes d'administration
    const formattedNotes = adminNotes?.trim() 
      ? adminNotes 
      : "Votre preuve de paiement n'a pas pu être validée. Veuillez réessayer avec une preuve plus claire ou utiliser un autre mode de paiement.";
    
    // Ajout de logs pour vérifier les URLs
    console.log("URLs générées pour l'email de rejet:", {
      paymentUrl: paymentUrl,
      mapsUrl: EVENT_LOCATION.mapsUrl
    });
    
    // Préparation des paramètres pour le template EmailJS
    const templateParams: EmailTemplateParams = {
      to_email: email,
      to_name: `${participantData.first_name} ${participantData.last_name}`,
      from_name: "IFTAR 2025",
      prenom: participantData.first_name,
      nom: participantData.last_name,
      email: participantData.email,
      tel: participantData.contact_number || "Non disponible",
      status: memberStatus,
      participant_id: participantData.id,
      app_url: appUrl,
      payment_url: paymentUrl, // URL complète déjà construite
      admin_notes: formattedNotes,
      maps_url: EVENT_LOCATION.mapsUrl,
      event_location: EVENT_LOCATION.name,
      event_address: EVENT_LOCATION.address,
      current_date: new Date().toLocaleString('fr-FR'),
      reply_to: "ne-pas-repondre@lacitadelle.ci"
    };
    
    // Ajouter un log pour vérifier les paramètres de configuration
    console.log("EmailJS configuration pour email de rejet:", {
      service_id: REJECTION_EMAILJS_SERVICE_ID,
      template_id: REJECTION_TEMPLATE_ID,
      params_count: Object.keys(templateParams).length
    });
    
    // Initialisation explicite pour éviter les problèmes d'authentification
    emailjs.init(REJECTION_EMAILJS_PUBLIC_KEY);
    
    const response = await emailjs.send(
      REJECTION_EMAILJS_SERVICE_ID,
      REJECTION_TEMPLATE_ID,
      templateParams
    );
    
    console.log("Email de rejet envoyé avec succès:", response);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de rejet:", error);
    return false;
  }
};
