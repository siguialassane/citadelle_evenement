// Service d'envoi d'emails pour le rejet des demandes d'adhésion
// Mise à jour: Utilisation du service unique et du template participant dynamique

import emailjs from '@emailjs/browser';
import { validateEmailData, prepareEmailData } from './emailValidation';
import { EmailTemplateParams } from './types';
import { toast } from '@/hooks/use-toast';
import {
  EMAILJS_SERVICE_ID,
  EMAILJS_PUBLIC_KEY,
  PARTICIPANT_TEMPLATE_ID
} from '../../config';

// Rejet de paiement pour un participant
export const sendPaymentRejectionEmail = async (participantData: any, rejectionReason: string = '') => {
  try {
    console.log("===== EMAIL DE REJET (paiement) =====");
    const validation = validateEmailData(participantData?.email, participantData);
    if (!validation.isValid) { console.error(validation.error); return false; }
    
    const email = prepareEmailData(participantData.email);
    const appUrl = window.location.origin;
    const tryAgainUrl = `${appUrl}/membership`;
    const reason = rejectionReason || "La demande ne correspond pas à nos critères actuels";

    const emailParticipantHtml = `
      <h2 style="color:#e74c3c;">❌ Demande rejetée</h2>
      <p>Bonjour ${participantData.first_name} ${participantData.last_name},</p>
      <p>Votre demande n'a malheureusement <strong>pas pu être validée</strong>.</p>
      <div style="background-color:#fdf2f2;padding:15px;border-radius:5px;margin:15px 0;border-left:4px solid #e74c3c;">
        <h3>Motif :</h3>
        <p>${reason}</p>
      </div>
      <a href="${tryAgainUrl}" style="display:inline-block;padding:12px 24px;background-color:#3498db;color:white;text-decoration:none;border-radius:5px;font-weight:bold;">Soumettre à nouveau</a>
      <p>Contact : club.lacitadelle@gmail.com</p>
    `;

    const templateParams: EmailTemplateParams = {
      to_email: email,
      subject: `Demande rejetée - ${participantData.first_name} ${participantData.last_name}`,
      email_participant: emailParticipantHtml,
      prenom: participantData.first_name,
      nom: participantData.last_name,
      reply_to: "club.lacitadelle@gmail.com"
    };

    await emailjs.send(EMAILJS_SERVICE_ID, PARTICIPANT_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);
    console.log("Email de rejet envoyé avec succès");
    return true;
  } catch (error) {
    console.error("Erreur envoi email de rejet:", error);
    toast({ title: "Erreur", description: "Impossible d'envoyer l'email de rejet.", variant: "destructive" });
    return false;
  }
};

// Rejet d'adhésion
export const sendMembershipRejectionEmail = async (membershipData: any, rejectionReason: string = '') => {
  try {
    console.log("===== EMAIL DE REJET (adhésion) =====");
    const validation = validateEmailData(membershipData?.email, membershipData);
    if (!validation.isValid) { console.error(validation.error); return false; }
    
    const email = prepareEmailData(membershipData.email);
    const appUrl = window.location.origin;
    const tryAgainUrl = `${appUrl}/membership`;
    const reason = rejectionReason || "La demande ne correspond pas à nos critères actuels";

    const emailParticipantHtml = `
      <h2 style="color:#e74c3c;">❌ Demande d'adhésion rejetée</h2>
      <p>Bonjour ${membershipData.first_name} ${membershipData.last_name},</p>
      <p>Nous sommes au regret de vous informer que votre demande d'adhésion au club <strong>La Citadelle</strong> n'a pas été retenue.</p>
      <div style="background-color:#fdf2f2;padding:15px;border-radius:5px;margin:15px 0;border-left:4px solid #e74c3c;">
        <h3>Motif :</h3>
        <p>${reason}</p>
      </div>
      <p>Vous pouvez soumettre une nouvelle demande si vous le souhaitez :</p>
      <a href="${tryAgainUrl}" style="display:inline-block;padding:12px 24px;background-color:#3498db;color:white;text-decoration:none;border-radius:5px;font-weight:bold;">Nouvelle demande</a>
      <p>Contact : club.lacitadelle@gmail.com</p>
    `;

    const templateParams: EmailTemplateParams = {
      to_email: email,
      subject: `Adhésion rejetée - ${membershipData.first_name} ${membershipData.last_name}`,
      email_participant: emailParticipantHtml,
      prenom: membershipData.first_name,
      nom: membershipData.last_name,
      reply_to: "club.lacitadelle@gmail.com"
    };

    await emailjs.send(EMAILJS_SERVICE_ID, PARTICIPANT_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);
    console.log("Email de rejet d'adhésion envoyé avec succès");
    return true;
  } catch (error) {
    console.error("Erreur envoi email de rejet d'adhésion:", error);
    toast({ title: "Erreur", description: "Impossible d'envoyer l'email de rejet.", variant: "destructive" });
    return false;
  }
};
