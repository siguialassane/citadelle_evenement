
import { supabase } from "../supabase/client";
import { CINETPAY_API_KEY, CINETPAY_SITE_ID } from "./config";

/**
 * Traite les notifications (webhooks) de CinetPay
 * @param payload Le payload de la notification
 * @returns Un objet contenant le statut et un message
 */
export const handleCinetPayWebhook = async (payload: any) => {
  try {
    console.log("Webhook CinetPay reçu:", payload);

    // Vérifier les données obligatoires
    const transactionId = payload.cpm_trans_id;
    const siteId = payload.cpm_site_id;
    const paymentDate = payload.payment_date;
    const paymentMethod = payload.payment_method;
    const status = payload.status;
    const amount = payload.amount;
    const operatorId = payload.operator_id;

    if (!transactionId || !siteId) {
      return { success: false, message: "Données incomplètes" };
    }

    // Vérifier que le site_id correspond à notre site_id
    if (siteId !== CINETPAY_SITE_ID) {
      return { success: false, message: "Site ID non reconnu" };
    }

    // Trouver le paiement correspondant dans la base de données
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('cinetpay_api_response_id', transactionId)
      .maybeSingle();

    if (fetchError || !payment) {
      console.error("Erreur lors de la récupération du paiement:", fetchError);
      return { success: false, message: "Paiement non trouvé" };
    }

    // Mettre à jour le statut du paiement
    const newStatus = status === "ACCEPTED" ? "success" : 
                      status === "REFUSED" ? "failed" : "pending";

    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: newStatus,
        cinetpay_operator_id: operatorId,
      })
      .eq('id', payment.id);

    if (updateError) {
      console.error("Erreur lors de la mise à jour du paiement:", updateError);
      return { success: false, message: "Erreur lors de la mise à jour du paiement" };
    }

    // Si le paiement est réussi, mettre à jour le participant avec un QR code
    if (newStatus === "success") {
      // Générer un identifiant unique pour le QR code
      const qrCodeId = `QR-${payment.participant_id}-${Date.now()}`;
      
      const { error: participantUpdateError } = await supabase
        .from('participants')
        .update({
          qr_code_id: qrCodeId
        })
        .eq('id', payment.participant_id);

      if (participantUpdateError) {
        console.error("Erreur lors de la mise à jour du participant:", participantUpdateError);
      }
    }

    return { success: true, message: "Notification traitée avec succès" };
  } catch (error) {
    console.error("Erreur lors du traitement de la notification CinetPay:", error);
    return { success: false, message: "Erreur interne" };
  }
};
