
// Service pour les opérations Supabase liées à la validation des paiements
// Mise à jour: Correction définitive de l'association du QR code au participant
// Mise à jour: Prise en charge de la nouvelle logique d'unicité - un email peut appartenir à plusieurs participants
// IMPORTANT: Consolidation de la logique des QR codes pour éviter les erreurs

import { supabase } from "@/integrations/supabase/client";
import { Payment } from "@/types/payment";
import { ValidationResponse } from "./types";
import { v4 as uuidv4 } from "uuid";

// Récupère tous les paiements
export const fetchAllPayments = async (): Promise<Payment[]> => {
  try {
    const { data: paymentsData, error: paymentsError } = await supabase
      .from('manual_payments')
      .select(`
        *,
        participants(*)
      `)
      .order('created_at', { ascending: false });

    if (paymentsError) throw paymentsError;

    if (!paymentsData || paymentsData.length === 0) {
      return [];
    }

    return formatPaymentsData(paymentsData);
  } catch (error: any) {
    console.error("Erreur lors de la récupération des paiements:", error);
    throw error;
  }
};

// Récupère un paiement par son ID
export const fetchPaymentById = async (id: string): Promise<Payment | null> => {
  try {
    const { data: paymentData, error: paymentError } = await supabase
      .from('manual_payments')
      .select(`
        *,
        participants(*)
      `)
      .eq('id', id)
      .single();

    if (paymentError) throw paymentError;

    if (!paymentData) {
      return null;
    }

    return formatSinglePayment(paymentData);
  } catch (error: any) {
    console.error("Erreur lors de la récupération du paiement:", error);
    throw error;
  }
};

// Met à jour le statut d'un paiement à "completed" et génère un QR code
export const validatePaymentInDatabase = async (paymentId: string): Promise<{qrCodeId: string; participantId: string}> => {
  try {
    console.log("==== MISE À JOUR DU STATUT DU PAIEMENT ET GÉNÉRATION QR CODE ====");
    console.log(`Validation du paiement ID: ${paymentId}`);
    
    // Mettre à jour le statut du paiement à "completed"
    const { error: updateError } = await supabase
      .from('manual_payments')
      .update({ 
        status: 'completed',
        validated_at: new Date().toISOString(),
        validated_by: "Admin" // Idéalement, remplacer par l'ID ou le nom de l'admin connecté
      })
      .eq('id', paymentId);

    if (updateError) {
      console.error("Erreur lors de la mise à jour du statut du paiement:", updateError);
      throw updateError;
    }
    
    console.log("Statut du paiement mis à jour avec succès dans la base de données");

    // Récupérer le paiement pour obtenir l'ID du participant
    const { data: paymentData, error: fetchError } = await supabase
      .from('manual_payments')
      .select('participant_id')
      .eq('id', paymentId)
      .single();

    if (fetchError) {
      console.error("Erreur lors de la récupération de l'ID du participant:", fetchError);
      throw fetchError;
    }

    if (!paymentData) {
      throw new Error("Données de paiement introuvables");
    }

    const participantId = paymentData.participant_id;
    console.log("ID du participant récupéré:", participantId);

    // Génération d'un UUID pour le QR code
    const qrCodeId = uuidv4();
    console.log("Génération d'un nouveau QR code ID:", qrCodeId);

    // Mettre à jour le statut du participant et associer le QR code
    console.log("Mise à jour du statut du participant et enregistrement du QR code...");
    
    // Mise à jour du QR code et du statut de check-in
    const { error: participantError } = await supabase
      .from('participants')
      .update({ 
        qr_code_id: qrCodeId,
        check_in_status: false  // Réinitialisation du statut de check-in
      })
      .eq('id', participantId);

    if (participantError) {
      console.error("Erreur lors de la mise à jour des données du participant:", participantError);
      throw participantError;
    }
    
    console.log("QR code associé au participant avec succès:", qrCodeId);
    console.log("Participant ID associé au QR code:", participantId);

    return { qrCodeId, participantId };
  } catch (error) {
    console.error("Erreur lors de la validation en base de données:", error);
    throw error;
  }
};

// Met à jour le statut d'un paiement à "rejected"
export const rejectPaymentInDatabase = async (paymentId: string): Promise<ValidationResponse> => {
  try {
    const { error: updateError } = await supabase
      .from('manual_payments')
      .update({ status: 'rejected' })
      .eq('id', paymentId);

    if (updateError) throw updateError;

    return { success: true };
  } catch (error: any) {
    console.error("Erreur lors du rejet du paiement:", error);
    return { success: false, error: error.message };
  }
};

// Récupère les données complètes d'un participant
export const fetchParticipantData = async (participantId: string): Promise<any> => {
  try {
    const { data: participantData, error: fetchError } = await supabase
      .from('participants')
      .select('*')
      .eq('id', participantId)
      .single();

    if (fetchError) {
      console.error("Erreur lors de la récupération des données du participant:", fetchError);
      throw fetchError;
    }
    
    if (!participantData) {
      console.error("Aucune donnée de participant trouvée pour l'ID:", participantId);
      throw new Error("Participant non trouvé");
    }
    
    return participantData;
  } catch (error) {
    console.error("Erreur lors de la récupération des données du participant:", error);
    throw error;
  }
};

// Vérifie si un participant avec le même email, prénom et nom existe déjà
export const checkParticipantExists = async (email: string, firstName: string, lastName: string): Promise<boolean> => {
  try {
    console.log("Vérification si le participant existe déjà:", { email, firstName, lastName });
    
    const { data, error, count } = await supabase
      .from('participants')
      .select('id', { count: 'exact' })
      .eq('email', email)
      .eq('first_name', firstName)
      .eq('last_name', lastName)
      .limit(1);
    
    if (error) {
      console.error("Erreur lors de la vérification du participant:", error);
      throw error;
    }
    
    const exists = (count && count > 0) || (data && data.length > 0);
    console.log("Le participant existe déjà:", exists);
    
    return exists;
  } catch (error) {
    console.error("Erreur lors de la vérification du participant:", error);
    return false;
  }
};

// Fonctions utilitaires pour formater les données

const formatPaymentsData = (paymentsData: any[]): Payment[] => {
  return paymentsData.map(payment => formatSinglePayment(payment));
};

const formatSinglePayment = (payment: any): Payment => {
  const date = new Date(payment.created_at);
  const formattedDate = date.toLocaleDateString('fr-FR');
  const formattedTime = date.toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });

  return {
    id: payment.id,
    participant_id: payment.participant_id,
    amount: payment.amount,
    payment_method: payment.payment_method,
    phone_number: payment.phone_number,
    status: payment.status,
    comments: payment.comments,
    created_at: payment.created_at,
    formatted_date: formattedDate,
    formatted_time: formattedTime,
    participant_name: `${payment.participants.first_name} ${payment.participants.last_name}`,
    participant_email: payment.participants.email,
    participant_phone: payment.participants.contact_number,
    participant: payment.participants
  };
};

/**
 * Récupère les détails d'un paiement spécifique
 */
export const fetchPaymentDetails = async (paymentId: string) => {
  try {
    console.log("Récupération des détails du paiement:", paymentId);
    
    const { data: payment, error } = await supabase
      .from('manual_payments')
      .select('*')
      .eq('id', paymentId)
      .single();
    
    if (error) {
      console.error("Erreur lors de la récupération des détails du paiement:", error);
      throw error;
    }
    
    console.log("Détails du paiement récupérés:", payment);
    return payment;
  } catch (error) {
    console.error("Erreur lors de la récupération des détails du paiement:", error);
    throw error;
  }
};
