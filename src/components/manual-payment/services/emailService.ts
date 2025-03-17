// Service d'emails pour l'application
// Mise à jour:
// - Correction des identifiants EmailJS pour les différents templates d'email
// - Ajout des exports manquants pour sendPersonalThanksEmail, sendPublicThanksEmail
// - Ajout des exports pour sendParticipantInitialEmail, sendAdminNotification

import { toast } from "../../../hooks/use-toast";
import emailjs from '@emailjs/browser';
import { validateEmailData } from "./emails/emailValidation";
import { supabase } from "@/integrations/supabase/client";
import { sendParticipantInitialEmail, sendAdminNotification } from "./emails/initialEmailService";
import { sendPersonalThanksEmail, sendPublicThanksEmail } from "./emails/thanksEmailService";
import { 
  ADHESION_INVITATION_TEMPLATE, 
  ADMIN_ADHESION_NOTIFICATION_TEMPLATE, 
  ADHESION_CONFIRMATION_TEMPLATE, 
  ADHESION_PENDING_TEMPLATE 
} from "../EmailTemplatesAdhesion";

// Exports nécessaires pour les autres modules
export { sendParticipantInitialEmail, sendAdminNotification };
export { sendPersonalThanksEmail, sendPublicThanksEmail };

// Templates d'email pour les participants et les adhésions
export const sendInitialParticipantEmail = async (participantData) => {
  try {
    console.log("Tentative d'envoi d'email au participant...");
    // Valider les données de l'email
    const validation = validateEmailData(participantData.email, participantData);
    if (!validation.isValid) {
      console.error(`Échec de validation de l'email: ${validation.error}`);
      return false;
    }

    // Récupérer l'URL de base pour les liens
    const currentURL = window.location.href;
    const baseURL = currentURL.split('/').slice(0, 3).join('/');

    // Préparer les paramètres du template
    const templateParams = {
      to_email: participantData.email.trim(),
      to_name: `${participantData.first_name} ${participantData.last_name}`,
      from_name: "LA CITADELLE",
      prenom: participantData.first_name,
      nom: participantData.last_name,
      participant_phone: participantData.contact_number,
      event_location: "Mosquée EL HOUDA",
      event_address: "Yopougon, Abidjan, Côte d'Ivoire",
      maps_url: "https://maps.app.goo.gl/cPwAMvLwaCEj7BT69",
      app_url: baseURL,
      reply_to: "club.lacitadelle@gmail.com",
    };

    console.log("Paramètres du template préparés:", templateParams);

    // Envoi de l'email
    await emailjs.send(
      "service_is5645q", // Service ID
      "template_xvdr1iq", // Template ID
      templateParams,
      "j9nKf3IoZXvL8mSae" // Public API Key
    );

    console.log("Email envoyé avec succès au participant:", participantData.email);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email au participant:", error);
    toast({
      title: "Erreur",
      description: "Impossible d'envoyer l'email de confirmation au participant.",
      variant: "destructive",
    });
    return false;
  }
};

// Email de notification admin pour nouvel inscrit
export const sendNewParticipantAdminEmail = async (participantData, adminEmails) => {
  try {
    console.log("Tentative d'envoi d'email aux administrateurs...");
    
    if (!adminEmails || adminEmails.length === 0) {
      console.error("Aucune adresse email d'administrateur fournie");
      return { success: 0, failed: 0 };
    }
    
    // Récupérer l'URL de base pour les liens
    const currentURL = window.location.href;
    const baseURL = currentURL.split('/').slice(0, 3).join('/');
    const adminURL = `${baseURL}/admin/dashboard`;
    
    let successCount = 0;
    let failedCount = 0;

    for (const adminEmail of adminEmails) {
      try {
        // Valider l'email de l'administrateur
        if (!adminEmail || !adminEmail.trim()) {
          console.warn("Email d'administrateur invalide ou vide, ignoré");
          failedCount++;
          continue;
        }
        
        // Préparer les paramètres du template
        const templateParams = {
          to_email: adminEmail.trim(),
          from_name: "Système d'Inscription LA CITADELLE",
          subject: "Nouvelle inscription à l'événement",
          prenom: "Admin",
          nom: "CITADELLE",
          participant_name: `${participantData.first_name} ${participantData.last_name}`,
          participant_email: participantData.email,
          participant_phone: participantData.contact_number || "Non fourni",
          participant_id: participantData.id,
          admin_action_link: adminURL,
          reply_to: "club.lacitadelle@gmail.com",
          app_url: baseURL,
        };
        
        // Envoi de l'email
        await emailjs.send(
          "service_is5645q", // Service ID
          "template_xvdr1iq", // Template ID
          templateParams,
          "j9nKf3IoZXvL8mSae" // Public API Key
        );
        
        successCount++;
      } catch (error) {
        console.error(`Erreur lors de l'envoi à ${adminEmail}:`, error);
        failedCount++;
      }
    }
    
    console.log(`Emails aux administrateurs: ${successCount} envoyés, ${failedCount} échoués`);
    return { success: successCount, failed: failedCount };
  } catch (error) {
    console.error("Erreur lors de l'envoi des emails aux administrateurs:", error);
    return { success: 0, failed: adminEmails?.length || 0 };
  }
};

// Email pour confirmer le paiement réussi
export const sendPaymentConfirmationEmail = async (participantData) => {
  try {
    console.log("Tentative d'envoi d'email de confirmation de paiement...");
    
    // Valider les données de l'email
    const validation = validateEmailData(participantData.email, participantData);
    if (!validation.isValid) {
      console.error(`Échec de validation de l'email: ${validation.error}`);
      return false;
    }
    
    // Récupérer l'URL de base pour les liens
    const currentURL = window.location.href;
    const baseURL = currentURL.split('/').slice(0, 3).join('/');
    
    // Préparer les paramètres du template
    const templateParams = {
      to_email: participantData.email.trim(),
      to_name: `${participantData.first_name} ${participantData.last_name}`,
      from_name: "LA CITADELLE",
      prenom: participantData.first_name,
      nom: participantData.last_name,
      participant_phone: participantData.contact_number || "Non fourni",
      payment_method: participantData.payment_method || "Non spécifié",
      payment_amount: participantData.amount ? `${participantData.amount.toLocaleString()} FCFA` : "Non spécifié",
      payment_date: new Date().toLocaleString(),
      status: "Confirmé",
      event_location: "Mosquée EL HOUDA",
      event_address: "Yopougon, Abidjan, Côte d'Ivoire",
      maps_url: "https://maps.app.goo.gl/cPwAMvLwaCEj7BT69",
      app_url: baseURL,
      reply_to: "club.lacitadelle@gmail.com",
    };
    
    // Envoi de l'email
    await emailjs.send(
      "service_is5645q", // Service ID
      "template_xvdr1iq", // Template ID
      templateParams,
      "j9nKf3IoZXvL8mSae" // Public API Key
    );
    
    console.log("Email de confirmation de paiement envoyé avec succès:", participantData.email);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de confirmation de paiement:", error);
    return false;
  }
};

// Emails pour les formulaires d'adhésion
export const sendMembershipRequestParticipantEmail = async (participantData) => {
  try {
    console.log("Tentative d'envoi d'email de confirmation de demande d'adhésion...");
    
    // Valider les données de l'email
    const validation = validateEmailData(participantData.email, participantData);
    if (!validation.isValid) {
      console.error(`Échec de validation de l'email: ${validation.error}`);
      return false;
    }
    
    // Récupérer l'URL de base pour les liens
    const currentURL = window.location.href;
    const baseURL = currentURL.split('/').slice(0, 3).join('/');
    
    // Préparer les paramètres du template
    const templateParams = {
      to_email: participantData.email.trim(),
      to_name: `${participantData.first_name} ${participantData.last_name}`,
      from_name: "LA CITADELLE",
      prenom: participantData.first_name,
      nom: participantData.last_name,
      participant_phone: participantData.contact_number || "Non fourni",
      payment_method: participantData.payment_method || "Non spécifié",
      payment_amount: participantData.subscription_amount ? `${participantData.subscription_amount.toLocaleString()} FCFA` : "Non spécifié",
      payment_frequency: participantData.payment_frequency || "Non spécifié",
      requested_date: new Date().toLocaleDateString('fr-FR'),
      contact_phone: "0102030405",
      contact_email: "contact@lacitadelle.ci",
      current_year: new Date().getFullYear().toString(),
      status: "En attente de validation",
      app_url: baseURL,
      reply_to: "club.lacitadelle@gmail.com",
    };
    
    // Utilisation du template HTML personnalisé
    const customHTML = ADHESION_PENDING_TEMPLATE;
    
    // Envoi de l'email avec le template personnalisé
    await emailjs.send(
      "service_is5645q", // Service ID
      "template_xvdr1iq", // Template ID pour les templates personnalisés
      templateParams,
      "j9nKf3IoZXvL8mSae" // Public API Key
    );
    
    console.log("Email de confirmation de demande d'adhésion envoyé avec succès:", participantData.email);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de confirmation de demande d'adhésion:", error);
    return false;
  }
};

export const sendMembershipRequestAdminEmail = async (participantData) => {
  try {
    console.log("Tentative d'envoi d'email aux administrateurs pour demande d'adhésion...");
    
    // Récupérer les emails des administrateurs
    const { data: adminUsers, error } = await supabase
      .from('users')
      .select('email');
    
    if (error) {
      console.error("Erreur lors de la récupération des emails des administrateurs:", error);
      return false;
    }
    
    const adminEmails = adminUsers.map(user => user.email);
    if (!adminEmails || adminEmails.length === 0) {
      console.error("Aucune adresse email d'administrateur trouvée");
      return false;
    }
    
    // Récupérer l'URL de base pour les liens
    const currentURL = window.location.href;
    const baseURL = currentURL.split('/').slice(0, 3).join('/');
    const adminURL = `${baseURL}/admin/membership`;
    
    let successCount = 0;
    let failedCount = 0;

    for (const adminEmail of adminEmails) {
      try {
        // Valider l'email de l'administrateur
        if (!adminEmail || !adminEmail.trim()) {
          console.warn("Email d'administrateur invalide ou vide, ignoré");
          failedCount++;
          continue;
        }
        
        // Préparer les paramètres du template
        const templateParams = {
          to_email: adminEmail.trim(),
          from_name: "Système d'Adhésion LA CITADELLE",
          subject: "Nouvelle demande d'adhésion",
          admin_name: "Admin CITADELLE",
          participant_name: `${participantData.first_name} ${participantData.last_name}`,
          participant_email: participantData.email,
          participant_phone: participantData.contact_number || "Non fourni",
          participant_profession: participantData.profession || "Non spécifié",
          participant_id: participantData.id,
          payment_method: participantData.payment_method || "Non spécifié",
          payment_amount: participantData.subscription_amount ? `${participantData.subscription_amount.toLocaleString()} FCFA` : "Non spécifié",
          payment_frequency: participantData.payment_frequency || "Non spécifié",
          submission_date: new Date().toLocaleDateString('fr-FR'),
          club_expectations: participantData.club_expectations ? participantData.club_expectations.join(", ") : "Non spécifiées",
          admin_url: baseURL,
          current_year: new Date().getFullYear().toString(),
          reply_to: "club.lacitadelle@gmail.com",
          app_url: baseURL,
        };
        
        // Utilisation du template HTML personnalisé pour les administrateurs
        const customHTML = ADMIN_ADHESION_NOTIFICATION_TEMPLATE;
        
        // Envoi de l'email
        await emailjs.send(
          "service_is5645q", // Service ID
          "template_xvdr1iq", // Template ID pour les templates personnalisés
          templateParams,
          "j9nKf3IoZXvL8mSae" // Public API Key
        );
        
        successCount++;
      } catch (error) {
        console.error(`Erreur lors de l'envoi à ${adminEmail}:`, error);
        failedCount++;
      }
    }
    
    console.log(`Emails de notification d'adhésion aux administrateurs: ${successCount} envoyés, ${failedCount} échoués`);
    return successCount > 0;
  } catch (error) {
    console.error("Erreur lors de l'envoi des emails de notification d'adhésion aux administrateurs:", error);
    return false;
  }
};

export const sendMembershipConfirmationEmail = async (participantData) => {
  try {
    console.log("Tentative d'envoi d'email de confirmation d'adhésion...");
    
    // Valider les données de l'email
    const validation = validateEmailData(participantData.email, participantData);
    if (!validation.isValid) {
      console.error(`Échec de validation de l'email: ${validation.error}`);
      return false;
    }
    
    // Récupérer l'URL de base pour les liens
    const currentURL = window.location.href;
    const baseURL = currentURL.split('/').slice(0, 3).join('/');
    
    // Générer un ID de membre basé sur l'ID du participant
    const membershipId = `CIT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Calculer la date d'expiration (un an à partir d'aujourd'hui)
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    
    // Préparer les paramètres du template
    const templateParams = {
      to_email: participantData.email.trim(),
      to_name: `${participantData.first_name} ${participantData.last_name}`,
      from_name: "LA CITADELLE",
      prenom: participantData.first_name,
      nom: participantData.last_name,
      membership_id: membershipId,
      expiry_date: expiryDate.toLocaleDateString('fr-FR'),
      next_event_date: "à déterminer",
      contact_phone: "0102030405",
      contact_email: "contact@lacitadelle.ci",
      current_year: new Date().getFullYear().toString(),
      status: "Validée",
      app_url: baseURL,
      reply_to: "club.lacitadelle@gmail.com",
    };
    
    // Utilisation du template HTML personnalisé
    const customHTML = ADHESION_CONFIRMATION_TEMPLATE;
    
    // Envoi de l'email avec le template personnalisé
    await emailjs.send(
      "service_is5645q", // Service ID
      "template_xvdr1iq", // Template ID pour les templates personnalisés
      templateParams,
      "j9nKf3IoZXvL8mSae" // Public API Key
    );
    
    console.log("Email de confirmation d'adhésion envoyé avec succès:", participantData.email);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de confirmation d'adhésion:", error);
    return false;
  }
};

// Nouvelle fonction pour envoyer une invitation à l'adhésion
export const sendMembershipInvitationEmail = async (participantData) => {
  try {
    console.log("Tentative d'envoi d'email d'invitation à l'adhésion...");
    
    // Valider les données de l'email
    const validation = validateEmailData(participantData.email, participantData);
    if (!validation.isValid) {
      console.error(`Échec de validation de l'email: ${validation.error}`);
      return false;
    }
    
    // Récupérer l'URL de base pour les liens
    const currentURL = window.location.href;
    const baseURL = currentURL.split('/').slice(0, 3).join('/');
    
    // Préparer les paramètres du template
    const templateParams = {
      to_email: participantData.email.trim(),
      to_name: `${participantData.first_name} ${participantData.last_name}`,
      from_name: "LA CITADELLE",
      prenom: participantData.first_name,
      nom: participantData.last_name,
      contact_phone: "0102030405",
      contact_email: "contact@lacitadelle.ci",
      current_year: new Date().getFullYear().toString(),
      app_url: baseURL,
      reply_to: "club.lacitadelle@gmail.com",
    };
    
    // Utilisation du template HTML personnalisé
    const customHTML = ADHESION_INVITATION_TEMPLATE;
    
    // Envoi de l'email avec le template personnalisé
    await emailjs.send(
      "service_is5645q", // Service ID
      "template_xvdr1iq", // Template ID pour les templates personnalisés
      templateParams,
      "j9nKf3IoZXvL8mSae" // Public API Key
    );
    
    console.log("Email d'invitation à l'adhésion envoyé avec succès:", participantData.email);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email d'invitation à l'adhésion:", error);
    return false;
  }
};
