import emailjs from '@emailjs/browser';
import { validateEmailData, prepareEmailData } from './emailValidation';
import { EmailTemplateParams } from './types';
import { 
  EMAILJS_SERVICE_ID, 
  EMAILJS_PUBLIC_KEY,
  PARTICIPANT_INITIAL_TEMPLATE_ID,
  ADMIN_NOTIFICATION_TEMPLATE_ID,
  PAYMENT_AMOUNT,
  EVENT_LOCATION
} from "../../config";

/**
 * Envoie un email à l'administrateur pour notifier d'un nouveau paiement
 * L'email du destinataire est désormais géré directement dans le template EmailJS
 */
export const sendAdminNotification = async (
  manualPaymentId: string,
  participantData: any,
  paymentMethod: string,
  phoneNumber: string,
  comments: string
) => {
  try {
    console.log("Envoi de notification à l'administrateur pour nouveau paiement...");
    console.log("Service pour emails INITIAUX UNIQUEMENT:", EMAILJS_SERVICE_ID);
    
    // Vérification des données du participant
    const validation = validateEmailData(participantData?.email, participantData);
    if (!validation.isValid) {
      console.error(validation.error);
      return false;
    }

    const appUrl = window.location.origin;
    const validationLink = `${appUrl}/admin/payment-validation/${manualPaymentId}`;

    // Formater les données pour s'assurer qu'elles ne sont pas vides
    const formattedComments = comments?.trim() || "Aucun commentaire";
    const formattedPaymentMethod = paymentMethod?.toUpperCase() || "NON SPÉCIFIÉ";
    const formattedPhoneNumber = phoneNumber?.trim() || "NON SPÉCIFIÉ";
    const currentDate = new Date().toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Préparation des paramètres pour le template EmailJS
    const templateParams: EmailTemplateParams = {
      to_email: 'DYNAMIC_ADMIN_EMAIL', // Valeur fictive, sera remplacée par EmailJS
      from_name: "Système d'Inscription IFTAR",
      participant_name: `${participantData.first_name} ${participantData.last_name}`,
      participant_email: participantData.email,
      participant_phone: participantData.contact_number || "NON SPÉCIFIÉ",
      payment_amount: `${PAYMENT_AMOUNT} XOF`,
      payment_method: formattedPaymentMethod,
      payment_phone: formattedPhoneNumber,
      comments: formattedComments,
      payment_id: manualPaymentId,
      participant_id: participantData.id,
      app_url: appUrl,
      current_date: currentDate,
      validation_link: validationLink,
      reply_to: "ne-pas-repondre@lacitadelle.ci",
      prenom: participantData.first_name,
      nom: participantData.last_name,
    };
    
    // Afficher les paramètres envoyés au template admin pour débogage
    console.log("Paramètres EmailJS pour template_dp1tu2w:", {
      participant_name: templateParams.participant_name,
      participant_email: templateParams.participant_email,
      payment_id: templateParams.payment_id,
      validation_link: templateParams.validation_link,
      comments: templateParams.comments,
      current_date: templateParams.current_date,
      payment_phone: templateParams.payment_phone,
      payment_method: templateParams.payment_method
    });

    // Envoi de l'email via EmailJS avec le template ADMIN_NOTIFICATION_TEMPLATE_ID
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      ADMIN_NOTIFICATION_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    console.log("Email de notification admin envoyé avec succès:", response);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email à l'administrateur:", error);
    return false;
  }
};

/**
 * Envoie un email initial au participant
 */
export const sendParticipantInitialEmail = async (participantData: any, paymentMethod: string, phoneNumber: string) => {
  try {
    console.log("===== PRÉPARATION EMAIL INITIAL AU PARTICIPANT =====");
    
    const validation = validateEmailData(participantData?.email, participantData);
    if (!validation.isValid) {
      console.error(validation.error);
      return false;
    }
    
    const email = prepareEmailData(participantData.email);
    const appUrl = window.location.origin;
    const pendingUrl = `${appUrl}/payment-pending/${participantData.id}?type=initial`;
    const memberStatus = participantData.is_member ? "Membre" : "Non membre";
    
    // Ajouter des logs pour vérifier les données du participant
    console.log("Données participant pour email initial:", {
      email: email,
      nom_complet: `${participantData.first_name} ${participantData.last_name}`,
      participant_email: participantData.email // Vérifier que cette valeur existe
    });
    
    const templateParams: EmailTemplateParams = {
      to_email: email, // UNIQUEMENT l'email du participant
      to_name: `${participantData.first_name} ${participantData.last_name}`,
      from_name: "IFTAR 2024",
      prenom: participantData.first_name,
      nom: participantData.last_name,
      participant_name: `${participantData.first_name} ${participantData.last_name}`, // Ajouté pour le template
      participant_email: participantData.email, // Ajouté pour le template
      participant_phone: participantData.contact_number || "Non disponible",
      status: memberStatus,
      payment_method: paymentMethod,
      payment_amount: `${PAYMENT_AMOUNT} XOF`,
      payment_phone: phoneNumber,
      app_url: appUrl,
      pending_url: pendingUrl,
      maps_url: EVENT_LOCATION.mapsUrl,
      event_location: EVENT_LOCATION.name,
      event_address: EVENT_LOCATION.address,
      current_date: new Date().toLocaleString('fr-FR'), // Ajout de la date actuelle formatée
      reply_to: "ne-pas-repondre@lacitadelle.ci"
    };

    // Ajouter un log pour vérifier les paramètres envoyés au template
    console.log("Paramètres EmailJS pour template_2ncsaxe:", {
      participant_name: templateParams.participant_name,
      participant_email: templateParams.participant_email,
      to_name: templateParams.to_name,
      current_date: templateParams.current_date // Log de la date pour vérification
    });

    // IMPORTANT: N'utilise que le template PARTICIPANT_INITIAL_TEMPLATE_ID pour le participant
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      PARTICIPANT_INITIAL_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    console.log("Email initial au participant envoyé avec succès:", response);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email initial au participant:", error);
    return false;
  }
};
