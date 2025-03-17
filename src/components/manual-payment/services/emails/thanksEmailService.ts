
// Service d'emails pour les remerciements aux participants
// - Implémentation d'emails personnalisés et groupés

import emailjs from '@emailjs/browser';
import { validateEmailData, prepareEmailData } from './emailValidation';
import { EmailSendResult, ParticipantEmailData, AdminNotificationEmailData } from './types';
import { 
  EMAILJS_SERVICE_ID, 
  EMAILJS_PUBLIC_KEY,
  EVENT_LOCATION
} from "../../config";

// Template IDs pour les emails de remerciement
const THANKS_TEMPLATE_ID = "template_xvdr1iq";

/**
 * Envoie un email de remerciement personnalisé à un participant
 */
export const sendPersonalThanksEmail = async (participant: any, message: string): Promise<boolean> => {
  try {
    console.log("Envoi d'email personnalisé de remerciement au participant:", participant.email);
    
    // Validation de l'email
    const validation = validateEmailData(participant?.email, participant);
    if (!validation.isValid) {
      console.error(validation.error);
      return false;
    }
    
    const email = prepareEmailData(participant.email);
    
    // Construire l'URL complète pour le site
    const appUrl = window.location.origin;
    
    // Préparation des paramètres pour le template
    const templateParams = {
      to_email: email,
      to_name: `${participant.first_name} ${participant.last_name}`,
      from_name: "LA CITADELLE",
      prenom: participant.first_name,
      nom: participant.last_name,
      participant_name: `${participant.first_name} ${participant.last_name}`,
      participant_email: participant.email,
      participant_id: participant.id,
      message: message,
      app_url: appUrl,
      maps_url: EVENT_LOCATION.mapsUrl,
      event_location: EVENT_LOCATION.name,
      event_address: EVENT_LOCATION.address,
      current_date: new Date().toLocaleDateString('fr-FR'),
      reply_to: "club.lacitadelle@gmail.com"
    };

    // Log pour débogage
    console.log("Paramètres pour email personnalisé:", {
      to_email: templateParams.to_email,
      participant_name: templateParams.participant_name,
      message_preview: templateParams.message.substring(0, 30) + "..."
    });

    // Envoi de l'email avec EmailJS
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      THANKS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    console.log("Email personnalisé envoyé avec succès:", response);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email personnalisé:", error);
    return false;
  }
};

/**
 * Envoie un email public à plusieurs participants
 */
export const sendPublicThanksEmail = async (participants: any[], message: string): Promise<EmailSendResult> => {
  try {
    console.log(`Préparation d'envoi d'un email public à ${participants.length} participants`);
    
    let successCount = 0;
    let failedCount = 0;
    
    // Envoi à chaque participant individuellement
    for (const participant of participants) {
      try {
        // Validation de l'email
        const validation = validateEmailData(participant?.email, participant);
        if (!validation.isValid) {
          console.error(`Email invalide pour ${participant.first_name} ${participant.last_name}: ${validation.error}`);
          failedCount++;
          continue;
        }
        
        const email = prepareEmailData(participant.email);
        
        // Construire l'URL complète
        const appUrl = window.location.origin;
        
        // Préparation des paramètres pour le template
        const templateParams = {
          to_email: email,
          to_name: `${participant.first_name} ${participant.last_name}`,
          from_name: "LA CITADELLE",
          prenom: participant.first_name,
          nom: participant.last_name,
          participant_name: `${participant.first_name} ${participant.last_name}`,
          message: message,
          app_url: appUrl,
          maps_url: EVENT_LOCATION.mapsUrl,
          event_location: EVENT_LOCATION.name,
          event_address: EVENT_LOCATION.address,
          current_date: new Date().toLocaleDateString('fr-FR'),
          reply_to: "club.lacitadelle@gmail.com"
        };
        
        // Envoi de l'email avec EmailJS
        await emailjs.send(
          EMAILJS_SERVICE_ID,
          THANKS_TEMPLATE_ID,
          templateParams,
          EMAILJS_PUBLIC_KEY
        );
        
        successCount++;
      } catch (error) {
        console.error(`Erreur lors de l'envoi à ${participant.email}:`, error);
        failedCount++;
      }
    }
    
    console.log(`Emails publics: ${successCount} envoyés, ${failedCount} échoués`);
    
    // Retourner le nombre d'emails envoyés et échoués
    return { success: successCount, failed: failedCount };
  } catch (error) {
    console.error("Erreur lors de l'envoi des emails publics:", error);
    return { success: 0, failed: participants.length };
  }
};
