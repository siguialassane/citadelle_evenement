
// Ce service gère toutes les opérations liées aux paiements dans la base de données
// Il encapsule la logique d'interaction avec Supabase pour les paiements
// Mise à jour: Support multi-places avec enregistrement des invités

import { supabase } from "@/integrations/supabase/client";
import { PAYMENT_AMOUNT } from "../config";
import { Guest } from "../types";

/**
 * Enregistre un nouveau paiement manuel dans la base de données
 * Supporte le multi-places: enregistre le paiement + les invités associés
 */
export const registerManualPayment = async (
  participantId: string,
  paymentMethod: string,
  phoneNumber: string,
  comments: string,
  numberOfPlaces: number = 1,
  guests: Guest[] = []
) => {
  try {
    console.log("Enregistrement du paiement manuel...");
    console.log(`Nombre de places: ${numberOfPlaces}, Montant total: ${numberOfPlaces * PAYMENT_AMOUNT}`);
    
    const totalAmount = numberOfPlaces * PAYMENT_AMOUNT;
    
    const { data: manualPayment, error: paymentError } = await supabase
      .from('manual_payments')
      .insert({
        participant_id: participantId,
        amount: totalAmount,
        payment_method: paymentMethod,
        phone_number: phoneNumber,
        comments: comments,
        status: 'pending',
        number_of_places: numberOfPlaces
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Erreur lors de l'enregistrement du paiement:", paymentError);
      throw new Error("Échec de l'enregistrement du paiement. Veuillez réessayer.");
    }

    console.log("Paiement manuel enregistré:", manualPayment);

    // Enregistrer les invités dans la table guests
    if (guests.length > 0) {
      const guestsToInsert = guests.map(guest => ({
        participant_id: participantId,
        payment_id: manualPayment.id,
        first_name: guest.first_name,
        last_name: guest.last_name,
        is_main_participant: guest.is_main_participant,
        check_in_status: false
      }));

      const { error: guestsError } = await supabase
        .from('guests')
        .insert(guestsToInsert);

      if (guestsError) {
        console.error("Erreur lors de l'enregistrement des invités:", guestsError);
        // Ne pas bloquer le flow, le paiement est déjà enregistré
        console.warn("Les invités n'ont pas pu être enregistrés mais le paiement a été créé");
      } else {
        console.log(`${guestsToInsert.length} invité(s) enregistré(s) avec succès`);
      }
    }

    return manualPayment;
  } catch (error) {
    console.error("Erreur dans le service de paiement:", error);
    throw error;
  }
};
