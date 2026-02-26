
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

    // Construire explicitement les URLs complètes
    const appUrl = window.location.origin;
    const validationLink = `${appUrl}/admin/payment-validation/${manualPaymentId}`;
    
    console.log("URL de validation construite:", validationLink);
    console.log("Origine de l'application:", appUrl);

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

    // Génération du contenu HTML pour l'email admin
    const emailAdminHtml = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background-color:#f4f9f6;">
        <div style="background-color:white;border-radius:10px;padding:30px;box-shadow:0 4px 12px rgba(0,0,0,0.08);border-top:5px solid #07553B;">
          <div style="text-align:center;color:#07553B;font-size:1.2em;margin-bottom:15px;font-style:italic;">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
          <div style="text-align:center;padding-bottom:15px;border-bottom:1px solid #e0f0e8;margin-bottom:20px;">
            <p style="font-size:2em;margin:0;">🌙</p>
            <h1 style="color:#07553B;font-size:1.4em;margin:5px 0;">Nouvelle Inscription — IFTAR 2026</h1>
            <p style="color:#555;margin:5px 0;">Demande de validation de paiement</p>
          </div>
          <p>Assalamou Aleykoum wa rahmatullahi wa barakatuh,</p>
          <p>Alhamdulillah ! Un(e) nouveau(elle) frère/sœur vient de soumettre sa demande d'inscription à l'<strong>IFTAR 2026</strong>. Merci de vérifier son paiement.</p>
          <div style="background-color:#f0f9f4;padding:15px 20px;border-radius:8px;margin:20px 0;border-left:4px solid #07553B;">
            <h3 style="margin-top:0;color:#07553B;">👤 Informations du participant :</h3>
            <ul style="list-style:none;padding-left:0;">
              <li><strong>Nom complet :</strong> ${participantData.first_name} ${participantData.last_name}</li>
              <li><strong>Email :</strong> ${participantData.email}</li>
              <li><strong>Téléphone :</strong> ${participantData.contact_number || 'NON SPÉCIFIÉ'}</li>
            </ul>
            <h3 style="color:#07553B;">💰 Détails du paiement :</h3>
            <ul style="list-style:none;padding-left:0;">
              <li><strong>Montant :</strong> ${PAYMENT_AMOUNT.toLocaleString()} FCFA</li>
              <li><strong>Méthode :</strong> ${formattedPaymentMethod}</li>
              <li><strong>Numéro utilisé :</strong> ${formattedPhoneNumber}</li>
              <li><strong>Date :</strong> ${currentDate}</li>
              <li><strong>Commentaires :</strong> ${formattedComments}</li>
            </ul>
          </div>
          <p>Veuillez vérifier que le paiement a bien été reçu avant de valider.</p>
          <div style="text-align:center;margin:25px 0;">
            <a href="${validationLink}" style="display:inline-block;padding:14px 28px;background-color:#07553B;color:white;text-decoration:none;border-radius:6px;font-weight:bold;font-size:1em;">✔️ Valider ce paiement</a>
          </div>
          <div style="text-align:center;margin-top:25px;font-size:0.85em;color:#888;border-top:1px solid #e0f0e8;padding-top:15px;">
            <p>Qu'Allah facilite votre travail et bénisse l'organisation de cet événement.</p>
            <p>Association LA CITADELLE — IFTAR 2026 © Tous droits réservés.</p>
          </div>
        </div>
      </div>
    `;

    // Préparation des paramètres pour le template EmailJS admin
    // Template: template_oz843jo - Params: {{{email_admin}}}, {{subject}}
    const templateParams: EmailTemplateParams = {
      subject: `Nouvelle inscription - ${participantData.first_name} ${participantData.last_name}`,
      email_admin: emailAdminHtml,
      // Params supplémentaires pour compatibilité
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
    console.log("Paramètres EmailJS pour notification admin:", {
      participant_name: templateParams.participant_name,
      participant_email: templateParams.participant_email,
      payment_id: templateParams.payment_id,
      validation_link: templateParams.validation_link, // Log de l'URL complète
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
  } catch (error: any) {
    console.error("Erreur envoi email admin:", error);
    console.error("Détails EmailJS:", error?.text || error?.message || JSON.stringify(error));
    // Ne pas bloquer le flow - l'admin peut vérifier manuellement
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
    
    // Construire explicitement l'URL complète pour le pending (pas de variables template)
    const appUrl = window.location.origin;
    const pendingUrl = `${appUrl}/payment-pending/${participantData.id}?type=initial`;
    
    console.log("URL de paiement en attente construite:", pendingUrl);
    console.log("ID du participant:", participantData.id);
    console.log("Origine de l'application:", appUrl);
    
    const memberStatus = participantData.is_member ? "Membre" : "Non membre";
    
    // Ajouter des logs pour vérifier les données du participant
    console.log("Données participant pour email initial:", {
      email: email,
      nom_complet: `${participantData.first_name} ${participantData.last_name}`,
      participant_email: participantData.email,
      participant_id: participantData.id // Vérifier que l'ID existe
    });
    
    // Génération du contenu HTML dynamique pour le participant
    const emailParticipantHtml = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background-color:#f4f9f6;">
        <div style="background-color:white;border-radius:10px;padding:30px;box-shadow:0 4px 12px rgba(0,0,0,0.08);border-top:5px solid #f39c12;">
          <div style="text-align:center;color:#07553B;font-size:1.3em;margin-bottom:15px;font-style:italic;">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
          <div style="text-align:center;padding-bottom:15px;border-bottom:1px solid #fdeeba;margin-bottom:20px;">
            <p style="font-size:2em;margin:0;">⏳</p>
            <h1 style="color:#d68910;font-size:1.4em;margin:5px 0;">Votre inscription est en attente de validation</h1>
            <span style="display:inline-block;background-color:#f39c12;color:white;padding:6px 16px;border-radius:20px;font-size:0.9em;">IFTAR 2026 — 15e Édition</span>
          </div>
          <p>Assalamou Aleykoum wa rahmatullahi wa barakatuh, cher(e) <strong>${participantData.first_name} ${participantData.last_name}</strong>,</p>
          <p>Barakallahu fik pour votre démarche ! Votre paiement pour l'<strong>IFTAR 2026</strong> a bien été reçu et est en cours de vérification par notre équipe. Qu'Allah facilite les choses pour vous.</p>
          <div style="background-color:#fffbe6;padding:15px 20px;border-radius:8px;margin:20px 0;border-left:4px solid #f39c12;">
            <h3 style="margin-top:0;color:#d68910;">💰 Récapitulatif de votre paiement :</h3>
            <ul style="list-style:none;padding-left:0;">
              <li><strong>Nom :</strong> ${participantData.first_name} ${participantData.last_name}</li>
              <li><strong>Email :</strong> ${participantData.email}</li>
              <li><strong>Téléphone :</strong> ${participantData.contact_number || 'Non disponible'}</li>
              <li><strong>Montant :</strong> ${PAYMENT_AMOUNT.toLocaleString()} FCFA</li>
              <li><strong>Méthode :</strong> ${paymentMethod}</li>
              <li><strong>Statut :</strong> ${memberStatus}</li>
            </ul>
          </div>
          <div style="background-color:#f0f9f4;border-left:4px solid #07553B;padding:12px 16px;margin:20px 0;font-style:italic;color:#555;border-radius:4px;">
            « Toute action étant liée à l'intention, chacun sera récompensé selon son intention. »<br>
            <em>(Hadith rapporté par Al-Bukhari et Muslim)</em>
          </div>
          <p>Votre inscription sera confirmée sous <strong>24 heures</strong> maximum. Vous recevrez un email avec votre QR code d'accès dès validation.</p>
          <div style="text-align:center;margin:20px 0;">
            <a href="${pendingUrl}" style="display:inline-block;padding:12px 24px;background-color:#f39c12;color:white;text-decoration:none;border-radius:6px;font-weight:bold;">🔍 Suivre mon dossier</a>
          </div>
          <div style="text-align:center;margin:20px 0;">
            <a href="${EVENT_LOCATION.mapsUrl}" style="display:inline-block;padding:12px 24px;background-color:#07553B;color:white;text-decoration:none;border-radius:6px;font-weight:bold;">📍 ${EVENT_LOCATION.name} — Voir sur Google Maps</a>
          </div>
          <div style="text-align:center;margin-top:25px;font-size:0.85em;color:#888;border-top:1px solid #fdeeba;padding-top:15px;">
            <p>Ramadan Moubarak 🌙 Qu'Allah bénisse votre démarche.</p>
            <p>Association LA CITADELLE — IFTAR 2026 © Tous droits réservés.</p>
          </div>
        </div>
      </div>
    `;

    // Template: template_3e5dq5i - Params: {{{email_participant}}}, {{to_email}}, {{subject}}
    const templateParams: EmailTemplateParams = {
      to_email: email,
      subject: `Inscription enregistrée - ${participantData.first_name} ${participantData.last_name}`,
      email_participant: emailParticipantHtml,
      // Params supplémentaires pour compatibilité
      to_name: `${participantData.first_name} ${participantData.last_name}`,
      from_name: "La Citadelle",
      prenom: participantData.first_name,
      nom: participantData.last_name,
      participant_name: `${participantData.first_name} ${participantData.last_name}`,
      participant_email: participantData.email,
      participant_phone: participantData.contact_number || "Non disponible",
      participant_id: participantData.id,
      status: memberStatus,
      payment_method: paymentMethod,
      payment_amount: `${PAYMENT_AMOUNT} XOF`,
      payment_phone: phoneNumber,
      app_url: appUrl,
      pending_url: pendingUrl,
      maps_url: EVENT_LOCATION.mapsUrl,
      event_location: EVENT_LOCATION.name,
      event_address: EVENT_LOCATION.address,
      current_date: new Date().toLocaleString('fr-FR'),
      reply_to: "ne-pas-repondre@lacitadelle.ci"
    };

    // Ajouter un log pour vérifier les paramètres envoyés au template
    console.log("Paramètres EmailJS pour email initial participant:", {
      participant_name: templateParams.participant_name,
      participant_email: templateParams.participant_email,
      participant_id: templateParams.participant_id,
      to_name: templateParams.to_name,
      current_date: templateParams.current_date,
      pending_url: templateParams.pending_url // Log de l'URL complète
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
  } catch (error: any) {
    console.error("Erreur envoi email participant:", error);
    console.error("Détails EmailJS:", error?.text || error?.message || JSON.stringify(error));
    return false;
  }
};
