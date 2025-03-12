
// Service pour l'envoi d'emails de remerciement personnalisés ou groupés
import emailjs from '@emailjs/browser';
import { validateEmailData } from './emailValidation';
import { EmailTemplateParams } from './types';

// Nouvelles valeurs pour le service d'envoi d'emails de remerciement
const THANKS_EMAILJS_SERVICE_ID = "service_ds3ba4m";
const THANKS_EMAILJS_PUBLIC_KEY = "4tSkd1KJOWW1HDLNC";
const THANKS_TEMPLATE_ID = "template_u407lzh";

// Format HTML pour l'email
const EMAIL_HTML_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; }
        .header { text-align: center; padding: 20px; background: #f5f5f5; color: green; }
        .content { padding: 20px; }
        .personal-message, .public-message { 
            margin-bottom: 15px; 
            padding: 15px; 
            border-left: 3px solid #2e7d32; 
            background-color: #f9f9f9; 
        }
        .footer { text-align: center; padding: 20px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Merci pour votre participation à l'IFTAR 2025</h1>
    </div>
    
    <div class="content">
        <p>Cher(e) {{prenom}} {{nom}},</p>
        
        <!-- Message personnel -->
        {{#if merci_perso}}
        <div class="personal-message">
            {{merci_perso}}
        </div>
        {{/if}}
        
        <!-- Message public -->
        {{#if merci_public}}
        <div class="public-message">
            {{merci_public}}
        </div>
        {{/if}}
    </div>
    
    <div class="footer">
        <p>Que Allah accepte nos prières et nos actes d'adoration.</p>
        <p>Cordialement,<br>L'équipe organisatrice de l'IFTAR 2025</p>
    </div>
</body>
</html>`;

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
    console.log("Public Key:", THANKS_EMAILJS_PUBLIC_KEY);
    
    const validation = validateEmailData(participantData?.email, participantData);
    if (!validation.isValid) {
      console.error(validation.error);
      return false;
    }
    
    // Préparation des données avec vérification des valeurs null/undefined
    const email = participantData.email.trim();
    const firstName = participantData.first_name || '';
    const lastName = participantData.last_name || '';
    
    // Remplacement dynamique de [prénom] par le prénom du participant directement
    // avant d'envoyer pour éviter les problèmes avec les templates EmailJS
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
      reply_to: "ne-pas-repondre@lacitadelle.ci",
      html_content: EMAIL_HTML_TEMPLATE.replace("{{prenom}}", firstName)
        .replace("{{nom}}", lastName)
        .replace("{{#if merci_perso}}", "")
        .replace("{{merci_perso}}", formattedPersonalMessage)
        .replace("{{/if}}", "")
        .replace("{{#if merci_public}}", "<!-- Pas de message public -->")
        .replace("{{merci_public}}", "")
        .replace("{{/if}}", "<!-- Fin de section -->")
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
    console.log("Public Key:", THANKS_EMAILJS_PUBLIC_KEY);
    
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
              reply_to: "ne-pas-repondre@lacitadelle.ci",
              html_content: EMAIL_HTML_TEMPLATE.replace("{{prenom}}", firstName)
                .replace("{{nom}}", lastName)
                .replace("{{#if merci_perso}}", "<!-- Pas de message personnel -->")
                .replace("{{merci_perso}}", "")
                .replace("{{/if}}", "<!-- Fin de section -->")
                .replace("{{#if merci_public}}", "")
                .replace("{{merci_public}}", formattedPublicMessage)
                .replace("{{/if}}", "")
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
