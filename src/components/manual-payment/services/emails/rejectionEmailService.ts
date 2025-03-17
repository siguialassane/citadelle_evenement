
// Service d'envoi d'emails de rejet pour les adhésions et paiements
// Gère l'envoi des notifications lorsqu'une demande d'adhésion ou un paiement est rejeté
// Mise à jour: Ajout de la fonction pour le rejet de paiement

import emailjs from '@emailjs/browser';
import { validateEmailData } from './emailValidation';
import { toast } from "@/hooks/use-toast";
import { ADHESION_REJECTION_TEMPLATE } from '../../EmailTemplatesAdhesion';

/**
 * Envoie un email de rejet d'adhésion au participant
 * @param participantData Données du participant
 * @param rejectionReason Raison du rejet (optionnel)
 * @returns Succès ou échec de l'envoi
 */
export const sendMembershipRejectionEmail = async (participantData: any, rejectionReason: string = '') => {
  try {
    console.log("Tentative d'envoi d'email de rejet d'adhésion...");
    
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
      rejection_reason: rejectionReason || "Votre profil ne correspond pas aux critères d'adhésion actuels de notre association.",
      contact_phone: "0102030405",
      contact_email: "contact@lacitadelle.ci",
      current_year: new Date().getFullYear().toString(),
      app_url: baseURL,
      reply_to: "club.lacitadelle@gmail.com",
    };
    
    // Utilisation du template HTML personnalisé pour l'email de rejet
    const customHTML = ADHESION_REJECTION_TEMPLATE;
    
    // Envoi de l'email
    await emailjs.send(
      "service_is5645q", // Service ID
      "template_xvdr1iq", // Template ID
      templateParams,
      "j9nKf3IoZXvL8mSae" // Public API Key
    );
    
    console.log("Email de rejet d'adhésion envoyé avec succès:", participantData.email);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de rejet d'adhésion:", error);
    toast({
      title: "Erreur",
      description: "Impossible d'envoyer l'email de rejet au participant.",
      variant: "destructive",
    });
    return false;
  }
};

/**
 * Envoie un email de rejet de paiement au participant
 * @param participantData Données du participant
 * @param rejectionReason Raison du rejet (optionnel)
 * @returns Succès ou échec de l'envoi
 */
export const sendPaymentRejectionEmail = async (participantData: any, rejectionReason: string = '') => {
  try {
    console.log("Tentative d'envoi d'email de rejet de paiement...");
    
    // Valider les données de l'email
    const validation = validateEmailData(participantData.email || participantData.participant_email, participantData);
    if (!validation.isValid) {
      console.error(`Échec de validation de l'email: ${validation.error}`);
      return false;
    }
    
    // Récupérer l'URL de base pour les liens
    const currentURL = window.location.href;
    const baseURL = currentURL.split('/').slice(0, 3).join('/');
    
    // Déterminer le nom du participant selon la structure des données
    const firstName = participantData.first_name || participantData.participant_name?.split(' ')[0] || '';
    const lastName = participantData.last_name || participantData.participant_name?.split(' ').slice(1).join(' ') || '';
    const email = participantData.email || participantData.participant_email;
    
    // Préparer les paramètres du template
    const templateParams = {
      to_email: email.trim(),
      to_name: `${firstName} ${lastName}`.trim(),
      from_name: "LA CITADELLE",
      prenom: firstName,
      nom: lastName,
      rejection_reason: rejectionReason || "Votre paiement n'a pas pu être validé. Veuillez réessayer ou contacter notre équipe.",
      contact_phone: "0102030405",
      contact_email: "contact@lacitadelle.ci",
      current_year: new Date().getFullYear().toString(),
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
    
    console.log("Email de rejet de paiement envoyé avec succès:", email);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de rejet de paiement:", error);
    toast({
      title: "Erreur",
      description: "Impossible d'envoyer l'email de rejet au participant.",
      variant: "destructive",
    });
    return false;
  }
};
