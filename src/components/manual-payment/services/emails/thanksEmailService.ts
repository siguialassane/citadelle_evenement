
// Service d'emails pour les remerciements aux participants
// - Implémentation d'emails personnalisés et groupés
// Mise à jour: Correction des identifiants EmailJS avec les nouvelles clés
// Mise à jour: Correction du formatage des variables personnalisées {{prenom}} et {{nom}}
// Mise à jour: Amélioration du remplacement des variables dynamiques dans les messages personnalisés

import emailjs from '@emailjs/browser';
import { validateEmailData, prepareEmailData } from './emailValidation';
import { EmailSendResult, ParticipantEmailData, AdminNotificationEmailData } from './types';
import { EVENT_LOCATION } from "../../config";

import {
  EMAILJS_SERVICE_ID,
  EMAILJS_PUBLIC_KEY,
  PARTICIPANT_TEMPLATE_ID
} from "../../config";

// Utilisation du service unique
const THANKS_EMAILJS_SERVICE_ID = EMAILJS_SERVICE_ID;
const THANKS_EMAILJS_PUBLIC_KEY = EMAILJS_PUBLIC_KEY;
const THANKS_TEMPLATE_ID = PARTICIPANT_TEMPLATE_ID;

/**
 * Formate les variables dynamiques dans le message
 * Cette fonction remplace les occurrences de {{variable}} par leur valeur
 */
const formatMessageVariables = (message: string, participant: any): string => {
  if (!message) return "";
  
  return message
    .replace(/\{\{prenom\}\}/g, participant.first_name)
    .replace(/\{\{nom\}\}/g, participant.last_name)
    .replace(/\{\{participant_name\}\}/g, `${participant.first_name} ${participant.last_name}`)
    .replace(/\{\{event_location\}\}/g, EVENT_LOCATION.name || "NOOM HOTEL ABIDJAN PLATEAU")
    .replace(/\{\{event_address\}\}/g, EVENT_LOCATION.address || "8XFG+9H3, Boulevard de Gaulle, BP 7393, Abidjan")
    .replace(/\{\{current_date\}\}/g, new Date().toLocaleDateString('fr-FR'));
};

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
    
    // Préformatage du message avec les variables remplacées
    const formattedMessage = formatMessageVariables(message, participant);
    
    // Génération du HTML dynamique pour l'email de remerciement
    const emailParticipantHtml = `
      <div>${formattedMessage}</div>
      <p style="margin-top:20px;">📍 ${EVENT_LOCATION.name}<br>${EVENT_LOCATION.address}</p>
      <a href="${EVENT_LOCATION.mapsUrl}">Voir sur Google Maps</a>
    `;

    // Préparation des paramètres pour le template
    const templateParams = {
      to_email: email,
      subject: `Message de La Citadelle - ${participant.first_name} ${participant.last_name}`,
      email_participant: emailParticipantHtml,
      prenom: participant.first_name,
      nom: participant.last_name,
      participant_name: `${participant.first_name} ${participant.last_name}`,
      participant_email: participant.email,
      participant_id: participant.id,
      message: formattedMessage,
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

    // Envoi de l'email via le service unique
    const response = await emailjs.send(
      THANKS_EMAILJS_SERVICE_ID,
      THANKS_TEMPLATE_ID,
      templateParams,
      THANKS_EMAILJS_PUBLIC_KEY
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
        
        // Préformatage du message avec les variables remplacées
        const formattedMessage = formatMessageVariables(message, participant);
        
        // Génération du HTML dynamique pour l'email de remerciement
        const emailParticipantHtml = `
          <div>${formattedMessage}</div>
          <p style="margin-top:20px;">📍 ${EVENT_LOCATION.name}<br>${EVENT_LOCATION.address}</p>
          <a href="${EVENT_LOCATION.mapsUrl}">Voir sur Google Maps</a>
        `;

        // Préparation des paramètres pour le template
        const templateParams = {
          to_email: email,
          subject: `Message de La Citadelle - ${participant.first_name} ${participant.last_name}`,
          email_participant: emailParticipantHtml,
          prenom: participant.first_name,
          nom: participant.last_name,
          participant_name: `${participant.first_name} ${participant.last_name}`,
          message: formattedMessage,
          app_url: appUrl,
          maps_url: EVENT_LOCATION.mapsUrl,
          event_location: EVENT_LOCATION.name,
          event_address: EVENT_LOCATION.address,
          current_date: new Date().toLocaleDateString('fr-FR'),
          reply_to: "club.lacitadelle@gmail.com"
        };
        
        // Envoi de l'email via le service unique
        await emailjs.send(
          THANKS_EMAILJS_SERVICE_ID,
          THANKS_TEMPLATE_ID,
          templateParams,
          THANKS_EMAILJS_PUBLIC_KEY
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
