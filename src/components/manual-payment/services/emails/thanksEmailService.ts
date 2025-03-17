
// Service d'envoi d'emails pour les remerciements et notifications d'adhésion
// Ajout: Support pour les notifications d'adhésion basé sur la nouvelle table memberships

import { supabase } from "@/integrations/supabase/client";
import { sendCustomEmail } from "./emailValidation";
import { AdminNotificationEmailData, ParticipantEmailData, EmailSendResult } from "./types";

// Envoi d'email de remerciement personnalisé
export const sendPersonalThanksEmail = async (participant: any, personalMessage: string): Promise<boolean> => {
  try {
    console.log(`Envoi d'email personnel à ${participant.email} avec message: ${personalMessage.substring(0, 20)}...`);
    const emailData: ParticipantEmailData = {
      participantEmail: participant.email,
      subject: "Merci pour votre paiement",
      templateParams: {
        participant_name: `${participant.first_name} ${participant.last_name}`,
        payment_amount: participant.amount ? participant.amount.toLocaleString() : "N/A",
        payment_date: new Date().toLocaleDateString('fr-FR'),
        message: personalMessage || "Nous avons bien reçu votre paiement et nous vous en remercions.",
        website_link: window.location.origin
      }
    };
    
    const sent = await sendCustomEmail(emailData, "participant_thanks");
    return Boolean(sent);
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de remerciement personnalisé:", error);
    return false;
  }
};

// Envoi d'email de remerciement public
export const sendPublicThanksEmail = async (participants: any[], publicMessage: string): Promise<EmailSendResult> => {
  try {
    console.log(`Envoi d'email public à ${participants.length} participants`);
    let successCount = 0;
    let failedCount = 0;
    
    for (const participant of participants) {
      try {
        const emailData: ParticipantEmailData = {
          participantEmail: participant.email,
          subject: "Merci pour votre contribution",
          templateParams: {
            participant_name: `${participant.first_name} ${participant.last_name}`,
            payment_amount: participant.amount ? participant.amount.toLocaleString() : "N/A",
            payment_date: new Date().toLocaleDateString('fr-FR'),
            message: publicMessage || "Nous vous remercions pour votre généreuse contribution. Votre soutien est essentiel pour notre association.",
            website_link: window.location.origin
          }
        };
        
        const sent = await sendCustomEmail(emailData, "participant_public_thanks");
        if (sent) {
          successCount++;
        } else {
          failedCount++;
        }
      } catch (error) {
        console.error(`Erreur lors de l'envoi à ${participant.email}:`, error);
        failedCount++;
      }
    }
    
    return { success: successCount, failed: failedCount };
  } catch (error) {
    console.error("Erreur lors de l'envoi des emails de remerciement public:", error);
    return { success: 0, failed: participants.length };
  }
};

// Ajout des nouvelles fonctions pour l'adhésion
export const sendMembershipRequestAdminEmail = async (participant: any): Promise<boolean> => {
  try {
    // Récupérer les administrateurs
    const { data: admins, error } = await supabase
      .from('users')
      .select('email');
    
    if (error) throw error;
    
    if (!admins || admins.length === 0) {
      console.error("Aucun administrateur trouvé pour envoyer l'email de notification d'adhésion");
      return false;
    }
    
    const adminEmails = admins.map(admin => admin.email);
    
    const emailData: AdminNotificationEmailData = {
      adminEmails,
      subject: "Nouvelle demande d'adhésion",
      templateParams: {
        participant_name: `${participant.first_name} ${participant.last_name}`,
        participant_email: participant.email,
        participant_id: participant.id,
        payment_amount: participant.subscription_amount?.toString() || "N/A",
        payment_date: new Date().toLocaleDateString('fr-FR'),
        message: "Un nouveau candidat souhaite rejoindre LA CITADELLE",
        admin_action_link: `${window.location.origin}/admin/membership`
      }
    };
    
    const result = await sendCustomEmail(emailData, "admin_membership_request");
    return Boolean(result);
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email administrateur pour l'adhésion:", error);
    return false;
  }
};

export const sendMembershipRequestParticipantEmail = async (participant: any): Promise<boolean> => {
  try {
    const emailData: ParticipantEmailData = {
      participantEmail: participant.email,
      subject: "Confirmation de votre demande d'adhésion à LA CITADELLE",
      templateParams: {
        participant_name: `${participant.first_name} ${participant.last_name}`,
        participant_email: participant.email,
        participant_id: participant.id,
        message: "Nous avons bien reçu votre demande d'adhésion.",
        website_link: window.location.origin
      }
    };
    
    const result = await sendCustomEmail(emailData, "participant_membership_request");
    return Boolean(result);
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email au participant pour l'adhésion:", error);
    return false;
  }
};

export const sendMembershipConfirmationEmail = async (participant: any): Promise<boolean> => {
  try {
    let membershipDetails;
    
    // Récupérer les détails de l'adhésion
    if (participant.membership_status === 'approved') {
      // Si nous avons les détails depuis la table participants
      membershipDetails = participant;
    } else {
      // Sinon, récupérer depuis la nouvelle table memberships
      const { data, error } = await supabase
        .from('memberships')
        .select('*')
        .eq('participant_id', participant.id)
        .eq('status', 'approved')
        .order('approved_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      membershipDetails = data || participant;
    }
    
    const emailData: ParticipantEmailData = {
      participantEmail: participant.email,
      subject: "Confirmation de votre adhésion à LA CITADELLE",
      templateParams: {
        participant_name: `${participant.first_name} ${participant.last_name}`,
        participant_email: participant.email,
        participant_id: participant.id,
        message: "Félicitations ! Votre demande d'adhésion a été approuvée. Vous êtes désormais membre de LA CITADELLE.",
        website_link: window.location.origin
      }
    };
    
    const result = await sendCustomEmail(emailData, "participant_membership_approved");
    return Boolean(result);
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de confirmation d'adhésion:", error);
    return false;
  }
};
