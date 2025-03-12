
// Service pour l'envoi d'emails de remerciement personnalisés ou groupés
import emailjs from '@emailjs/browser';
import { validateEmailData } from './emailValidation';
import { EmailTemplateParams } from './types';
import { REJECTION_EMAILJS_SERVICE_ID, REJECTION_EMAILJS_PUBLIC_KEY } from "../../config";

// Template ID pour les emails de remerciement
const THANKS_TEMPLATE_ID = "template_mzzgjud";

/**
 * Envoie un email de remerciement personnalisé à un participant
 */
export const sendPersonalThanksEmail = async (
  participantData: any, 
  personalMessage: string
): Promise<boolean> => {
  try {
    console.log("===== PRÉPARATION EMAIL DE REMERCIEMENT PERSONNEL =====");
    
    const validation = validateEmailData(participantData?.email, participantData);
    if (!validation.isValid) {
      console.error(validation.error);
      return false;
    }
    
    const templateParams: EmailTemplateParams = {
      to_email: participantData.email,
      to_name: `${participantData.first_name} ${participantData.last_name}`,
      from_name: "IFTAR 2024",
      prenom: participantData.first_name,
      nom: participantData.last_name,
      merci_perso: personalMessage,
      merci_public: "", // Vide pour le message personnel
      app_url: window.location.origin,
      reply_to: "ne-pas-repondre@lacitadelle.ci"
    };

    console.log("Envoi email personnel à:", participantData.email);
    
    const response = await emailjs.send(
      REJECTION_EMAILJS_SERVICE_ID,
      THANKS_TEMPLATE_ID,
      templateParams,
      REJECTION_EMAILJS_PUBLIC_KEY
    );

    console.log("Email de remerciement personnel envoyé avec succès:", response);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de remerciement personnel:", error);
    return false;
  }
};

/**
 * Envoie un email de remerciement public à un groupe de participants
 */
export const sendPublicThanksEmail = async (
  participantsData: any[], 
  publicMessage: string
): Promise<{success: number, failed: number}> => {
  try {
    console.log("===== PRÉPARATION EMAILS DE REMERCIEMENT PUBLIC =====");
    console.log(`Tentative d'envoi à ${participantsData.length} participants`);
    
    let successCount = 0;
    let failedCount = 0;
    
    // Traitement par lots pour éviter la surcharge
    const batchSize = 5;
    for (let i = 0; i < participantsData.length; i += batchSize) {
      const batch = participantsData.slice(i, i + batchSize);
      
      // Attendre que tous les emails du lot soient envoyés
      const results = await Promise.all(
        batch.map(async (participant) => {
          try {
            const validation = validateEmailData(participant?.email, participant);
            if (!validation.isValid) {
              console.error(`Email invalide pour ${participant.first_name} ${participant.last_name}: ${validation.error}`);
              return false;
            }
            
            const templateParams: EmailTemplateParams = {
              to_email: participant.email,
              to_name: `${participant.first_name} ${participant.last_name}`,
              from_name: "IFTAR 2024",
              prenom: participant.first_name,
              nom: participant.last_name,
              merci_perso: "", // Vide pour le message public
              merci_public: publicMessage,
              app_url: window.location.origin,
              reply_to: "ne-pas-repondre@lacitadelle.ci"
            };
            
            console.log("Envoi email public à:", participant.email);
            
            const response = await emailjs.send(
              REJECTION_EMAILJS_SERVICE_ID,
              THANKS_TEMPLATE_ID,
              templateParams,
              REJECTION_EMAILJS_PUBLIC_KEY
            );
            
            console.log(`Email envoyé à ${participant.email}:`, response.status);
            return true;
          } catch (error) {
            console.error(`Erreur d'envoi à ${participant.email}:`, error);
            return false;
          }
        })
      );
      
      // Comptabiliser les résultats
      results.forEach(success => success ? successCount++ : failedCount++);
      
      // Petite pause entre les lots pour éviter les limitations d'API
      if (i + batchSize < participantsData.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`Résumé des envois: ${successCount} réussis, ${failedCount} échoués`);
    return { success: successCount, failed: failedCount };
  } catch (error) {
    console.error("Erreur générale lors de l'envoi des emails de remerciement:", error);
    return { success: 0, failed: participantsData.length };
  }
};
