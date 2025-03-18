
// Service d'emails pour les remerciements aux participants
// - Implémentation d'emails personnalisés et groupés
// Mise à jour: Correction des identifiants EmailJS avec les nouvelles clés
// Mise à jour: Correction du formatage des variables personnalisées {{prenom}} et {{nom}}

import emailjs from '@emailjs/browser';
import { validateEmailData, prepareEmailData } from './emailValidation';
import { EmailSendResult, ParticipantEmailData, AdminNotificationEmailData } from './types';
import { EVENT_LOCATION } from "../../config";

// Mise à jour des identifiants EmailJS pour les emails de remerciement
const THANKS_EMAILJS_SERVICE_ID = "service_is5645q";
const THANKS_EMAILJS_PUBLIC_KEY = "j9nKf3IoZXvL8mSae";
const THANKS_TEMPLATE_ID = "template_xvdr1iq";

/**
 * Envoie un email de remerciement personnalisé à un participant
 */
export const sendPersonalThanksEmail = async (participant: any, message: string): Promise<boolean> => {
  try {
    console.log("===== PRÉPARATION EMAIL PERSONNALISÉ =====");
    
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
      to_email: email, // Email dynamique positionné en premier
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
      prenom: templateParams.prenom,
      nom: templateParams.nom,
      message_preview: templateParams.message.substring(0, 30) + "..."
    });

    // Envoi de l'email avec les NOUVELLES identifiants EmailJS
    const response = await emailjs.send(
      THANKS_EMAILJS_SERVICE_ID, // Nouvelle valeur: service_is5645q
      THANKS_TEMPLATE_ID,        // Nouvelle valeur: template_xvdr1iq
      templateParams,
      THANKS_EMAILJS_PUBLIC_KEY  // Nouvelle valeur: j9nKf3IoZXvL8mSae
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
          to_email: email, // Email dynamique positionné en premier
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
        
        // Envoi de l'email avec les NOUVELLES identifiants EmailJS
        await emailjs.send(
          THANKS_EMAILJS_SERVICE_ID, // Nouvelle valeur: service_is5645q
          THANKS_TEMPLATE_ID,        // Nouvelle valeur: template_xvdr1iq
          templateParams,
          THANKS_EMAILJS_PUBLIC_KEY  // Nouvelle valeur: j9nKf3IoZXvL8mSae
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
