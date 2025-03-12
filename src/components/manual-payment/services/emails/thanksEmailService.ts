
// Service pour l'envoi d'emails de remerciement personnalisés ou groupés
import emailjs from '@emailjs/browser';
import { validateEmailData } from './emailValidation';
import { EmailTemplateParams } from './types';
import { REJECTION_EMAILJS_SERVICE_ID, REJECTION_EMAILJS_PUBLIC_KEY } from "../../config";

// Nouvelles valeurs pour le service d'envoi d'emails de remerciement
const THANKS_EMAILJS_SERVICE_ID = "service_ds3ba4m";
const THANKS_EMAILJS_PUBLIC_KEY = "4tSkd1KJOWW1HDLNC";
const THANKS_TEMPLATE_ID = "template_u407lzh";

/**
 * Envoie un email de remerciement personnalisé à un participant
 */
export const sendPersonalThanksEmail = async (
  participantData: any, 
  personalMessage: string
): Promise<boolean> => {
  try {
    console.log("===== PRÉPARATION EMAIL DE REMERCIEMENT PERSONNEL =====");
    console.log("Service ID:", THANKS_EMAILJS_SERVICE_ID);
    console.log("Template ID:", THANKS_TEMPLATE_ID);
    
    const validation = validateEmailData(participantData?.email, participantData);
    if (!validation.isValid) {
      console.error(validation.error);
      return false;
    }
    
    // Préparation des données avec vérification des valeurs null/undefined
    const email = participantData.email.trim();
    const firstName = participantData.first_name || '';
    const lastName = participantData.last_name || '';
    
    // Remplacement dynamique de [prénom] par le prénom du participant
    const formattedPersonalMessage = personalMessage.replace(/\[prénom\]/g, firstName);
    
    const templateParams: EmailTemplateParams = {
      to_email: email,
      to_name: `${firstName} ${lastName}`,
      from_name: "IFTAR 2025",
      prenom: firstName,
      nom: lastName,
      merci_perso: formattedPersonalMessage,
      merci_public: "", // Vide pour le message personnel
      app_url: window.location.origin,
      reply_to: "ne-pas-repondre@lacitadelle.ci"
    };

    console.log("Envoi email personnel à:", email);
    console.log("Paramètres du template:", {
      template_id: THANKS_TEMPLATE_ID,
      service_id: THANKS_EMAILJS_SERVICE_ID,
      participant_name: `${firstName} ${lastName}`,
      merci_perso: formattedPersonalMessage.substring(0, 50) + "..."
    });
    
    const response = await emailjs.send(
      THANKS_EMAILJS_SERVICE_ID,
      THANKS_TEMPLATE_ID,
      templateParams,
      THANKS_EMAILJS_PUBLIC_KEY
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
    console.log("Service ID:", THANKS_EMAILJS_SERVICE_ID);
    console.log("Template ID:", THANKS_TEMPLATE_ID);
    
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
            
            // Vérification et préparation des données
            const email = participant.email.trim();
            const firstName = participant.first_name || '';
            const lastName = participant.last_name || '';
            
            // Remplacement dynamique de [prénom] par le prénom du participant
            const formattedPublicMessage = publicMessage.replace(/\[prénom\]/g, firstName);
            
            const templateParams: EmailTemplateParams = {
              to_email: email,
              to_name: `${firstName} ${lastName}`,
              from_name: "IFTAR 2025",
              prenom: firstName,
              nom: lastName,
              merci_perso: "", // Vide pour le message public
              merci_public: formattedPublicMessage,
              app_url: window.location.origin,
              reply_to: "ne-pas-repondre@lacitadelle.ci"
            };
            
            console.log("Envoi email public à:", email);
            console.log("Paramètres pour email public:", {
              template_id: THANKS_TEMPLATE_ID,
              service_id: THANKS_EMAILJS_SERVICE_ID,
              participant_name: `${firstName} ${lastName}`
            });
            
            const response = await emailjs.send(
              THANKS_EMAILJS_SERVICE_ID,
              THANKS_TEMPLATE_ID,
              templateParams,
              THANKS_EMAILJS_PUBLIC_KEY
            );
            
            console.log(`Email envoyé à ${email}:`, response.status);
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
