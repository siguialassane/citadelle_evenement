
// Ce service gère toutes les opérations liées aux paiements dans la base de données
// Il encapsule la logique d'interaction avec Supabase pour les paiements

import { supabase } from "@/integrations/supabase/client";
import { PAYMENT_AMOUNT } from "../config";

/**
 * Enregistre un nouveau paiement manuel dans la base de données
 */
export const registerManualPayment = async (
  participantId: string,
  paymentMethod: string,
  phoneNumber: string,
  comments: string
) => {
  try {
    console.log("Enregistrement du paiement manuel...");
    const { data: manualPayment, error: paymentError } = await supabase
      .from('manual_payments')
      .insert({
        participant_id: participantId,
        amount: PAYMENT_AMOUNT,
        payment_method: paymentMethod,
        phone_number: phoneNumber,
        comments: comments,
        status: 'pending'
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Erreur lors de l'enregistrement du paiement:", paymentError);
      throw new Error("Échec de l'enregistrement du paiement. Veuillez réessayer.");
    }

    console.log("Paiement manuel enregistré:", manualPayment);
    return manualPayment;
  } catch (error) {
    console.error("Erreur dans le service de paiement:", error);
    throw error;
  }
};
