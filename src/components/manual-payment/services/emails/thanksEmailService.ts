
// Service pour l'envoi d'emails de remerciement personnalisés ou groupés
import emailjs from '@emailjs/browser';
import { validateEmailData } from './emailValidation';
import { EmailTemplateParams } from './types';

// Nouvelles valeurs pour le service d'envoi d'emails de remerciement (mise à jour)
const THANKS_EMAILJS_SERVICE_ID = "service_is5645q";
const THANKS_EMAILJS_PUBLIC_KEY = "j9nKf3IoZXvL8mSae";
const THANKS_TEMPLATE_ID = "template_xvdr1iq";

// Valeurs pour l'envoi d'emails d'adhésion à l'admin et au participant
const MEMBERSHIP_REQUEST_SERVICE_ID = "service_1gvwp2w";
const MEMBERSHIP_REQUEST_PUBLIC_KEY = "wdtFy3bjHd5FNRQLg";
const MEMBERSHIP_REQUEST_PARTICIPANT_TEMPLATE_ID = "template_s3c9tsw";
const MEMBERSHIP_REQUEST_ADMIN_TEMPLATE_ID = "template_mzzgjud";

// Valeurs pour l'envoi d'emails de confirmation d'adhésion
const MEMBERSHIP_CONFIRMATION_SERVICE_ID = "service_wrk5x0l";
const MEMBERSHIP_CONFIRMATION_PUBLIC_KEY = "uQAHVMcvEXg6coHr9";
const MEMBERSHIP_CONFIRMATION_TEMPLATE_ID = "template_sdofxhv";

// Format HTML pour l'email - Optimisé pour éviter les filtres anti-spam
const EMAIL_HTML_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; }
        .header { text-align: center; padding: 20px; background: #f5f5f5; color: green; }
        .validate-btn {
            display: block;
            width: 200px;
            margin: 20px auto;
            padding: 12px 20px;
            background-color: #3498db;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            text-align: center;
            font-weight: bold;
            transition: background-color 0.3s ease;
        }
        .content { padding: 20px; }
        .footer { text-align: center; padding: 20px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Merci pour votre participation à l'IFTAR 2025</h1>
    </div>
    
    <div class="content">
        <!-- Message personnel conditionnel -->
        <div class="personal-message">
            {{merci_perso}}
        </div>
        
        <!-- Message public conditionnel -->
        <div class="public-message">
            {{merci_public}}
        </div>
        
        <p>Nous sommes toujours soucieux de nous améliorer et de vous offrir des événements de qualité. C'est pourquoi nous aimerions connaître votre avis sur l'évènement IFTAR 14e Édition. Vos commentaires nous seront précieux pour l'organisation de nos prochains événements.</p>
        
        <p>Pour nous faire part de votre expérience, cliquez sur le bouton ci-dessous :</p>
        
        <a href="https://docs.google.com/forms/d/e/1FAIpQLScvfzLqsx1site7OWzH2eC0v2p1lFkxcewByOSfpbeTgmhqjA/viewform?usp=sharing" class="validate-btn">Donnez votre avis</a>
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
    
    // Remplacement dynamique de [prénom] et [nom] par les valeurs du participant
    const formattedPersonalMessage = personalMessage
      .replace(/\[prénom\]/g, firstName)
      .replace(/\[nom\]/g, lastName);
    
    const templateParams: EmailTemplateParams = {
      to_email: email,
      to_name: `${firstName} ${lastName}`,
      from_name: "IFTAR 2025",
      prenom: firstName,
      nom: lastName,
      merci_perso: formattedPersonalMessage, // Message personnel
      merci_public: "", // Vide pour message personnel
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
            
            // Remplacement dynamique de [prénom] et [nom] par les valeurs du participant
            const formattedPublicMessage = publicMessage
              .replace(/\[prénom\]/g, firstName)
              .replace(/\[nom\]/g, lastName);
            
            const templateParams: EmailTemplateParams = {
              to_email: email,
              to_name: `${firstName} ${lastName}`,
              from_name: "IFTAR 2025",
              prenom: firstName,
              nom: lastName,
              merci_perso: "", // Vide pour message public
              merci_public: formattedPublicMessage, // Message public
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

/**
 * Envoie un email à l'administrateur pour l'informer d'une nouvelle demande d'adhésion
 */
export const sendMembershipRequestAdminEmail = async (
  participantData: any
): Promise<boolean> => {
  try {
    console.log("===== PRÉPARATION EMAIL DE DEMANDE D'ADHÉSION (ADMIN) =====");
    console.log("Service ID:", MEMBERSHIP_REQUEST_SERVICE_ID);
    console.log("Template ID:", MEMBERSHIP_REQUEST_ADMIN_TEMPLATE_ID);
    console.log("Public Key:", MEMBERSHIP_REQUEST_PUBLIC_KEY);
    
    // Configuration de l'email à l'administrateur
    const adminEmail = "admin@lacitadelle.ci"; // Remplacer par l'email de l'administrateur
    const firstName = participantData.first_name || '';
    const lastName = participantData.last_name || '';
    
    const templateParams: EmailTemplateParams = {
      to_email: adminEmail,
      from_name: "Système d'Adhésion LA CITADELLE",
      prenom: firstName,
      nom: lastName,
      participant_phone: participantData.contact_number || '',
      participant_email: participantData.email || '',
      app_url: window.location.origin,
      admin_dashboard_url: `${window.location.origin}/admin/dashboard`,
      reply_to: participantData.email || "ne-pas-repondre@lacitadelle.ci"
    };
    
    console.log("Envoi email à l'administrateur:", adminEmail);
    
    const response = await emailjs.send(
      MEMBERSHIP_REQUEST_SERVICE_ID,
      MEMBERSHIP_REQUEST_ADMIN_TEMPLATE_ID,
      templateParams,
      MEMBERSHIP_REQUEST_PUBLIC_KEY
    );
    
    console.log("Email de demande d'adhésion (admin) envoyé avec succès:", response);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de demande d'adhésion (admin):", error);
    return false;
  }
};

/**
 * Envoie un email au participant pour l'informer que sa demande d'adhésion est en cours d'étude
 */
export const sendMembershipRequestParticipantEmail = async (
  participantData: any
): Promise<boolean> => {
  try {
    console.log("===== PRÉPARATION EMAIL DE DEMANDE D'ADHÉSION (PARTICIPANT) =====");
    console.log("Service ID:", MEMBERSHIP_REQUEST_SERVICE_ID);
    console.log("Template ID:", MEMBERSHIP_REQUEST_PARTICIPANT_TEMPLATE_ID);
    console.log("Public Key:", MEMBERSHIP_REQUEST_PUBLIC_KEY);
    
    const validation = validateEmailData(participantData?.email, participantData);
    if (!validation.isValid) {
      console.error(validation.error);
      return false;
    }
    
    const email = participantData.email.trim();
    const firstName = participantData.first_name || '';
    const lastName = participantData.last_name || '';
    
    const templateParams: EmailTemplateParams = {
      to_email: email,
      to_name: `${firstName} ${lastName}`,
      from_name: "LA CITADELLE",
      prenom: firstName,
      nom: lastName,
      app_url: window.location.origin,
      reply_to: "ne-pas-repondre@lacitadelle.ci"
    };
    
    console.log("Envoi email au participant:", email);
    
    const response = await emailjs.send(
      MEMBERSHIP_REQUEST_SERVICE_ID,
      MEMBERSHIP_REQUEST_PARTICIPANT_TEMPLATE_ID,
      templateParams,
      MEMBERSHIP_REQUEST_PUBLIC_KEY
    );
    
    console.log("Email de demande d'adhésion (participant) envoyé avec succès:", response);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de demande d'adhésion (participant):", error);
    return false;
  }
};

/**
 * Envoie un email de confirmation d'adhésion au participant
 */
export const sendMembershipConfirmationEmail = async (
  participantData: any
): Promise<boolean> => {
  try {
    console.log("===== PRÉPARATION EMAIL DE CONFIRMATION D'ADHÉSION =====");
    console.log("Service ID:", MEMBERSHIP_CONFIRMATION_SERVICE_ID);
    console.log("Template ID:", MEMBERSHIP_CONFIRMATION_TEMPLATE_ID);
    console.log("Public Key:", MEMBERSHIP_CONFIRMATION_PUBLIC_KEY);
    
    const validation = validateEmailData(participantData?.email, participantData);
    if (!validation.isValid) {
      console.error(validation.error);
      return false;
    }
    
    const email = participantData.email.trim();
    const firstName = participantData.first_name || '';
    const lastName = participantData.last_name || '';
    
    const templateParams: EmailTemplateParams = {
      to_email: email,
      to_name: `${firstName} ${lastName}`,
      from_name: "LA CITADELLE",
      prenom: firstName,
      nom: lastName,
      app_url: window.location.origin,
      reply_to: "ne-pas-repondre@lacitadelle.ci"
    };
    
    console.log("Envoi email de confirmation d'adhésion à:", email);
    
    const response = await emailjs.send(
      MEMBERSHIP_CONFIRMATION_SERVICE_ID,
      MEMBERSHIP_CONFIRMATION_TEMPLATE_ID,
      templateParams,
      MEMBERSHIP_CONFIRMATION_PUBLIC_KEY
    );
    
    console.log("Email de confirmation d'adhésion envoyé avec succès:", response);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de confirmation d'adhésion:", error);
    return false;
  }
};
