
// Service d'emails pour l'application
// Mise à jour: Tous les emails passent par un seul service EmailJS (service_xt9q709)
// 2 templates: template_oz843jo (admin) et template_3e5dq5i (participant)

import { toast } from "../../../hooks/use-toast";
import emailjs from '@emailjs/browser';
import { validateEmailData } from "./emails/emailValidation";
import { supabase } from "@/integrations/supabase/client";
import { sendParticipantInitialEmail, sendAdminNotification } from "./emails/initialEmailService";
import { sendPersonalThanksEmail, sendPublicThanksEmail } from "./emails/thanksEmailService";
import { 
  EMAILJS_SERVICE_ID, 
  EMAILJS_PUBLIC_KEY, 
  ADMIN_NOTIFICATION_TEMPLATE_ID,
  PARTICIPANT_TEMPLATE_ID,
  EVENT_LOCATION 
} from "../config";

// Exports nécessaires pour les autres modules
export { sendParticipantInitialEmail, sendAdminNotification };
export { sendPersonalThanksEmail, sendPublicThanksEmail };

// Email initial au participant (lors de l'inscription)
export const sendInitialParticipantEmail = async (participantData) => {
  try {
    console.log("Envoi d'email initial au participant...");
    const validation = validateEmailData(participantData.email, participantData);
    if (!validation.isValid) {
      console.error(`Échec de validation de l'email: ${validation.error}`);
      return false;
    }

    const baseURL = window.location.origin;

    const emailParticipantHtml = `
      <h2>Inscription enregistrée</h2>
      <p>Bonjour ${participantData.first_name} ${participantData.last_name},</p>
      <p>Merci pour votre inscription ! Votre demande est en cours de traitement.</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <h3>Vos informations :</h3>
        <ul style="list-style: none; padding-left: 0;">
          <li><strong>Nom :</strong> ${participantData.first_name} ${participantData.last_name}</li>
          <li><strong>Téléphone :</strong> ${participantData.contact_number || 'Non fourni'}</li>
        </ul>
      </div>
      <p>📍 Lieu : ${EVENT_LOCATION.name}<br>${EVENT_LOCATION.address}</p>
      <a href="${EVENT_LOCATION.mapsUrl}">Voir sur Google Maps</a>
    `;

    const templateParams = {
      to_email: participantData.email.trim(),
      subject: `Inscription enregistrée - ${participantData.first_name} ${participantData.last_name}`,
      email_participant: emailParticipantHtml,
      prenom: participantData.first_name,
      nom: participantData.last_name,
      reply_to: "club.lacitadelle@gmail.com",
    };

    await emailjs.send(EMAILJS_SERVICE_ID, PARTICIPANT_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);
    console.log("Email envoyé avec succès au participant:", participantData.email);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email au participant:", error);
    toast({ title: "Erreur", description: "Impossible d'envoyer l'email de confirmation au participant.", variant: "destructive" });
    return false;
  }
};

// Email de notification admin pour nouvel inscrit
export const sendNewParticipantAdminEmail = async (participantData, adminEmails) => {
  try {
    console.log("Envoi de notification aux administrateurs...");
    if (!adminEmails || adminEmails.length === 0) {
      console.error("Aucune adresse email d'administrateur fournie");
      return { success: 0, failed: 0 };
    }

    const baseURL = window.location.origin;
    const adminURL = `${baseURL}/admin/dashboard`;

    const emailAdminHtml = `
      <h2>Nouvelle inscription</h2>
      <p>Un nouveau participant s'est inscrit et nécessite votre attention.</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <ul style="list-style: none; padding-left: 0;">
          <li><strong>Nom :</strong> ${participantData.first_name} ${participantData.last_name}</li>
          <li><strong>Email :</strong> ${participantData.email}</li>
          <li><strong>Téléphone :</strong> ${participantData.contact_number || 'Non fourni'}</li>
        </ul>
      </div>
      <a href="${adminURL}" style="display:inline-block;padding:12px 24px;background-color:#27ae60;color:white;text-decoration:none;border-radius:5px;font-weight:bold;">Voir le tableau de bord</a>
    `;

    const templateParams = {
      subject: `Nouvelle inscription - ${participantData.first_name} ${participantData.last_name}`,
      email_admin: emailAdminHtml,
      participant_name: `${participantData.first_name} ${participantData.last_name}`,
      participant_email: participantData.email,
      reply_to: "club.lacitadelle@gmail.com",
    };

    await emailjs.send(EMAILJS_SERVICE_ID, ADMIN_NOTIFICATION_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);
    console.log("Email de notification admin envoyé avec succès");
    return { success: 1, failed: 0 };
  } catch (error) {
    console.error("Erreur lors de l'envoi des emails aux administrateurs:", error);
    return { success: 0, failed: adminEmails?.length || 0 };
  }
};

// Email pour confirmer le paiement réussi
export const sendPaymentConfirmationEmail = async (participantData) => {
  try {
    console.log("Envoi email de confirmation de paiement...");
    const validation = validateEmailData(participantData.email, participantData);
    if (!validation.isValid) {
      console.error(`Échec de validation de l'email: ${validation.error}`);
      return false;
    }

    const baseURL = window.location.origin;

    const emailParticipantHtml = `
      <h2 style="color:#27ae60;">✅ Paiement confirmé</h2>
      <p>Bonjour ${participantData.first_name} ${participantData.last_name},</p>
      <p>Votre paiement a été <strong>validé avec succès</strong>.</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <ul style="list-style: none; padding-left: 0;">
          <li><strong>Montant :</strong> ${participantData.amount ? `${participantData.amount.toLocaleString()} FCFA` : 'Non spécifié'}</li>
          <li><strong>Méthode :</strong> ${participantData.payment_method || 'Non spécifié'}</li>
          <li><strong>Date :</strong> ${new Date().toLocaleString('fr-FR')}</li>
        </ul>
      </div>
      <p>📍 Lieu : ${EVENT_LOCATION.name}<br>${EVENT_LOCATION.address}</p>
      <a href="${EVENT_LOCATION.mapsUrl}">Voir sur Google Maps</a>
    `;

    const templateParams = {
      to_email: participantData.email.trim(),
      subject: `Paiement confirmé - ${participantData.first_name} ${participantData.last_name}`,
      email_participant: emailParticipantHtml,
      prenom: participantData.first_name,
      nom: participantData.last_name,
      reply_to: "club.lacitadelle@gmail.com",
    };

    await emailjs.send(EMAILJS_SERVICE_ID, PARTICIPANT_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);
    console.log("Email de confirmation de paiement envoyé avec succès:", participantData.email);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de confirmation de paiement:", error);
    return false;
  }
};

// Email de confirmation de demande d'adhésion au participant
export const sendMembershipRequestParticipantEmail = async (participantData) => {
  try {
    console.log("Envoi email confirmation demande d'adhésion...");
    const validation = validateEmailData(participantData.email, participantData);
    if (!validation.isValid) {
      console.error(`Échec de validation de l'email: ${validation.error}`);
      return false;
    }

    const emailParticipantHtml = `
      <h2>Demande d'adhésion enregistrée</h2>
      <p>Bonjour ${participantData.first_name} ${participantData.last_name},</p>
      <p>Votre demande d'adhésion au club La Citadelle a bien été enregistrée.</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <ul style="list-style: none; padding-left: 0;">
          <li><strong>Cotisation :</strong> ${participantData.subscription_amount ? `${participantData.subscription_amount.toLocaleString()} FCFA` : 'Non spécifié'}</li>
          <li><strong>Fréquence :</strong> ${participantData.payment_frequency || 'Non spécifié'}</li>
          <li><strong>Méthode :</strong> ${participantData.payment_method || 'Non spécifié'}</li>
          <li><strong>Statut :</strong> En attente de validation</li>
        </ul>
      </div>
      <p>Un administrateur examinera votre demande. Vous serez notifié par email.</p>
    `;

    const templateParams = {
      to_email: participantData.email.trim(),
      subject: `Demande d'adhésion enregistrée - ${participantData.first_name} ${participantData.last_name}`,
      email_participant: emailParticipantHtml,
      prenom: participantData.first_name,
      nom: participantData.last_name,
      reply_to: "club.lacitadelle@gmail.com",
    };

    await emailjs.send(EMAILJS_SERVICE_ID, PARTICIPANT_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);
    console.log("Email de confirmation de demande d'adhésion envoyé:", participantData.email);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de confirmation de demande d'adhésion:", error);
    return false;
  }
};

// Email admin pour nouvelle demande d'adhésion
export const sendMembershipRequestAdminEmail = async (participantData) => {
  try {
    console.log("Envoi notification admin pour demande d'adhésion...");
    const baseURL = window.location.origin;
    const adminURL = `${baseURL}/admin/membership`;

    const emailAdminHtml = `
      <h2>Nouvelle demande d'adhésion</h2>
      <p>Un nouveau candidat demande à rejoindre le club.</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <ul style="list-style: none; padding-left: 0;">
          <li><strong>Nom :</strong> ${participantData.first_name} ${participantData.last_name}</li>
          <li><strong>Email :</strong> ${participantData.email}</li>
          <li><strong>Téléphone :</strong> ${participantData.contact_number || 'Non fourni'}</li>
          <li><strong>Profession :</strong> ${participantData.profession || 'Non spécifié'}</li>
          <li><strong>Cotisation :</strong> ${participantData.subscription_amount ? `${participantData.subscription_amount.toLocaleString()} FCFA` : 'Non spécifié'}</li>
        </ul>
      </div>
      <a href="${adminURL}" style="display:inline-block;padding:12px 24px;background-color:#27ae60;color:white;text-decoration:none;border-radius:5px;font-weight:bold;">Voir les demandes d'adhésion</a>
    `;

    const templateParams = {
      subject: `Nouvelle demande d'adhésion - ${participantData.first_name} ${participantData.last_name}`,
      email_admin: emailAdminHtml,
      participant_name: `${participantData.first_name} ${participantData.last_name}`,
      participant_email: participantData.email,
      reply_to: "club.lacitadelle@gmail.com",
    };

    await emailjs.send(EMAILJS_SERVICE_ID, ADMIN_NOTIFICATION_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);
    console.log("Notification admin pour adhésion envoyée");
    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de la notification admin pour adhésion:", error);
    return false;
  }
};

// Email de confirmation d'adhésion validée
export const sendMembershipConfirmationEmail = async (participantData) => {
  try {
    console.log("Envoi email de confirmation d'adhésion...");
    const validation = validateEmailData(participantData.email, participantData);
    if (!validation.isValid) {
      console.error(`Échec de validation de l'email: ${validation.error}`);
      return false;
    }

    const emailParticipantHtml = `
      <h2 style="color:#27ae60;">✅ Adhésion validée</h2>
      <p>Bonjour ${participantData.first_name} ${participantData.last_name},</p>
      <p>Nous avons le plaisir de vous informer que votre demande d'adhésion au club <strong>La Citadelle</strong> a été <strong>approuvée</strong> !</p>
      <p>Bienvenue parmi nous ! Vous êtes désormais membre du club.</p>
      <p>Pour toute question, n'hésitez pas à nous contacter.</p>
    `;

    const templateParams = {
      to_email: participantData.email.trim(),
      subject: `Adhésion validée - Bienvenue ${participantData.first_name} !`,
      email_participant: emailParticipantHtml,
      prenom: participantData.first_name,
      nom: participantData.last_name,
      reply_to: "club.lacitadelle@gmail.com",
    };

    await emailjs.send(EMAILJS_SERVICE_ID, PARTICIPANT_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);
    console.log("Email de confirmation d'adhésion envoyé:", participantData.email);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de confirmation d'adhésion:", error);
    return false;
  }
};
