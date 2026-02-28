
// Service d'envoi d'emails pour la validation des paiements
// Mise à jour: Utilisation du template participant unique (template_3e5dq5i)
// Le contenu HTML est généré dynamiquement via {{{email_participant}}}
// Mise à jour: Support multi-places avec liste des invités

import emailjs from '@emailjs/browser';
import { supabase } from "@/integrations/supabase/client";
import { 
  CONFIRMATION_EMAILJS_SERVICE_ID,
  CONFIRMATION_EMAILJS_PUBLIC_KEY,
  CONFIRMATION_TEMPLATE_ID,
  EVENT_LOCATION,
  PAYMENT_AMOUNT
} from "@/components/manual-payment/config";

/**
 * Récupère les invités associés à un participant
 */
const fetchGuestsForParticipant = async (participantId: string) => {
  try {
    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .eq('participant_id', participantId)
      .order('is_main_participant', { ascending: false });
    
    if (error) {
      console.error("Erreur récupération des invités:", error);
      return [];
    }
    return data || [];
  } catch {
    return [];
  }
};

/**
 * Récupère le nombre de places depuis le paiement
 */
const fetchPaymentPlaces = async (participantId: string) => {
  try {
    const { data, error } = await supabase
      .from('manual_payments')
      .select('number_of_places, amount')
      .eq('participant_id', participantId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !data) return { numberOfPlaces: 1, amount: PAYMENT_AMOUNT };
    return { numberOfPlaces: data.number_of_places || 1, amount: data.amount || PAYMENT_AMOUNT };
  } catch {
    return { numberOfPlaces: 1, amount: PAYMENT_AMOUNT };
  }
};

export const sendConfirmationEmail = async (participantData: any, qrCodeId: string): Promise<boolean> => {
  try {
    console.log("==== ENVOI EMAIL DE CONFIRMATION ====");
    console.log("Service:", CONFIRMATION_EMAILJS_SERVICE_ID);
    console.log("Template:", CONFIRMATION_TEMPLATE_ID);
    
    if (!participantData || !participantData.email) {
      console.error("Données du participant ou email manquants pour la confirmation");
      return false;
    }
    
    const email = participantData.email.trim();
    if (!email || email === '') {
      console.error("Email vide après trim() pour la confirmation");
      return false;
    }
    
    // Construction des URLs
    const appUrl = window.location.origin;
    const confirmationPageUrl = `${appUrl}/confirmation/${qrCodeId}?type=qr&pid=${participantData.id}`;
    const encodedConfirmationUrl = encodeURIComponent(confirmationPageUrl);
    const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedConfirmationUrl}&qzone=2`;
    const receiptUrl = `${appUrl}/receipt/${participantData.id}`;
    const memberStatus = participantData.is_member ? "Membre" : "Non membre";
    const confirmationDate = new Date().toLocaleDateString('fr-FR');

    // Récupérer les invités et infos de places
    const guests = await fetchGuestsForParticipant(participantData.id);
    const { numberOfPlaces, amount: totalAmount } = await fetchPaymentPlaces(participantData.id);
    
    // Générer la liste des invités HTML
    let guestListHtml = '';
    if (numberOfPlaces > 1 && guests.length > 0) {
      guestListHtml = `<h3 style="color:#333;">Participants (${numberOfPlaces} places) :</h3><ul style="list-style:none;padding-left:0;">`;
      guests.forEach((guest: any, index: number) => {
        const tag = guest.is_main_participant ? ' (principal)' : '';
        guestListHtml += `<li><strong>Place ${index + 1} :</strong> ${guest.first_name} ${guest.last_name}${tag}</li>`;
      });
      guestListHtml += '</ul>';
    }

    const placesInfo = numberOfPlaces > 1 ? ` (${numberOfPlaces} places)` : '';

    // Génération du contenu HTML dynamique pour la confirmation
    const emailParticipantHtml = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background-color:#f7f7f7;">
        <div style="background-color:white;border-radius:8px;padding:30px;box-shadow:0 2px 8px rgba(0,0,0,0.06);border:1px solid #e0e0e0;">
          <div style="text-align:center;color:#07553B;font-size:1.2em;margin-bottom:15px;font-style:italic;">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
          <div style="text-align:center;padding-bottom:15px;border-bottom:1px solid #e0e0e0;margin-bottom:20px;">
            <h1 style="color:#07553B;font-size:1.5em;margin:5px 0;">Inscription confirmée${placesInfo} — IFTAR 2026</h1>
            <span style="display:inline-block;background-color:#07553B;color:white;padding:5px 14px;border-radius:4px;font-size:0.9em;">15e Édition</span>
          </div>
          <p>Assalamou Aleykoum wa rahmatullahi wa barakatuh, cher(e) <strong>${participantData.first_name} ${participantData.last_name}</strong>,</p>
          <p>Alhamdulillah ! Votre paiement a été validé. ${numberOfPlaces > 1 ? `Vous et vos ${numberOfPlaces - 1} invité(s) êtes` : 'Vous êtes'} officiellement inscrit(e${numberOfPlaces > 1 ? 's' : ''}) à l'<strong>IFTAR 2026</strong>. Qu'Allah vous récompense pour votre engagement et votre généreux soutien.</p>
          <div style="background-color:#f9f9f9;padding:15px 20px;border-radius:6px;margin:20px 0;border:1px solid #e0e0e0;">
            <h3 style="margin-top:0;color:#333;">Détails de l'événement :</h3>
            <ul style="list-style:none;padding-left:0;">
              <li><strong>Date :</strong> Dimanche 8 Mars 2026</li>
              <li><strong>Heure :</strong> De 16h00 à 21h00</li>
              <li><strong>Conférencier :</strong> Imam Cheick Ahmad Tidiane DIABATE</li>
              <li><strong>Thème :</strong> « Le Coran : Parole incréée, source de guidance divine et de repère pour l'humanité »</li>
            </ul>
            <h3 style="color:#333;">Vos informations :</h3>
            <ul style="list-style:none;padding-left:0;">
              <li><strong>Nom :</strong> ${participantData.first_name} ${participantData.last_name}</li>
              <li><strong>Email :</strong> ${participantData.email}</li>
              <li><strong>Téléphone :</strong> ${participantData.contact_number || 'Non disponible'}</li>
              <li><strong>Nombre de places :</strong> ${numberOfPlaces}</li>
              <li><strong>Montant payé :</strong> ${totalAmount.toLocaleString()} FCFA</li>
              <li><strong>Statut :</strong> ${memberStatus}</li>
              <li><strong>Date de confirmation :</strong> ${confirmationDate}</li>
            </ul>
            ${guestListHtml}
          </div>
          <p style="text-align:center;color:#07553B;font-weight:bold;">Votre QR code d'accès :</p>
          <div style="text-align:center;margin:15px 0;">
            <img src="${qrCodeImageUrl}" alt="QR Code d'accès" style="width:200px;height:200px;border:1px solid #e0e0e0;border-radius:6px;padding:5px;" />
          </div>
          <p style="text-align:center;font-size:0.9em;color:#888;">Présentez ce QR code à l'entrée de l'événement${numberOfPlaces > 1 ? ' pour tout le groupe' : ''}</p>
          <div style="background-color:#f9f9f9;padding:12px 16px;margin:20px 0;font-style:italic;color:#555;border-radius:6px;border:1px solid #e0e0e0;">
            « Celui qui nourrit un jeûneur recevra la même récompense que lui, sans que cela ne diminue en rien la récompense du jeûneur. »<br>
            <em>(Hadith rapporté par At-Tirmidhi)</em>
          </div>
          <p>NB : 5 000 FCFA de votre pass seront utilisés pour offrir <strong>5 repas chauds</strong> à des indigents. Qu'Allah multiplie votre récompense.</p>
          <div style="text-align:center;margin:20px 0;">
            <a href="${confirmationPageUrl}" style="display:inline-block;padding:12px 24px;background-color:#07553B;color:white;text-decoration:none;border-radius:6px;font-weight:bold;">Voir ma confirmation</a>
          </div>
          <div style="text-align:center;margin:10px 0;">
            <a href="${EVENT_LOCATION.mapsUrl}" style="display:inline-block;padding:12px 24px;background-color:#444;color:white;text-decoration:none;border-radius:6px;font-weight:bold;">${EVENT_LOCATION.name} — Voir sur Google Maps</a>
          </div>
          <div style="text-align:center;margin-top:25px;font-size:0.85em;color:#888;border-top:1px solid #e0e0e0;padding-top:15px;">
            <p>Ramadan Moubarak. Qu'Allah accepte nos jeûnes et nos prières.</p>
            <p>Association LA CITADELLE — IFTAR 2026 © Tous droits réservés.</p>
          </div>
        </div>
      </div>
    `;

    // Template: template_3e5dq5i - Params: {{{email_participant}}}, {{to_email}}, {{subject}}
    const templateParams = {
      to_email: email,
      subject: `Inscription confirmée${placesInfo} - ${participantData.first_name} ${participantData.last_name}`,
      email_participant: emailParticipantHtml,
      prenom: participantData.first_name,
      nom: participantData.last_name,
      participant_name: `${participantData.first_name} ${participantData.last_name}`,
      participant_phone: participantData.contact_number || "Non disponible",
      participant_id: participantData.id,
      status: memberStatus,
      qr_code_url: qrCodeImageUrl,
      confirmation_url: confirmationPageUrl,
      receipt_url: receiptUrl,
      app_url: appUrl,
      maps_url: EVENT_LOCATION.mapsUrl,
      event_location: EVENT_LOCATION.name,
      event_address: EVENT_LOCATION.address,
      confirmation_date: confirmationDate,
      reply_to: "ne-pas-repondre@lacitadelle.ci"
    };

    console.log("Paramètres EmailJS pour email de confirmation:", {
      to_email: templateParams.to_email,
      subject: templateParams.subject,
      numberOfPlaces,
    });

    const response = await emailjs.send(
      CONFIRMATION_EMAILJS_SERVICE_ID,
      CONFIRMATION_TEMPLATE_ID,
      templateParams,
      CONFIRMATION_EMAILJS_PUBLIC_KEY
    );

    console.log("Email de confirmation envoyé avec succès:", response);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de confirmation:", error);
    return false;
  }
};
