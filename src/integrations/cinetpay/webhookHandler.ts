
import { supabase } from "../supabase/client";
import { CINETPAY_API_KEY, CINETPAY_SITE_ID } from "./config";

/**
 * Traite les notifications (webhooks) de CinetPay
 * @param payload Le payload de la notification
 * @returns Un objet contenant le statut et un message
 */
export const handleCinetPayWebhook = async (payload: any) => {
  try {
    console.log("Webhook CinetPay reçu:", JSON.stringify(payload, null, 2));

    // Vérifier les données obligatoires
    const transactionId = payload.cpm_trans_id;
    const siteId = payload.cpm_site_id;
    const paymentDate = payload.payment_date;
    const paymentMethod = payload.payment_method;
    const status = payload.status;
    const amount = payload.amount;
    const operatorId = payload.operator_id;
    const apiResponseId = payload.api_response_id || ""; // Récupération de l'api_response_id s'il existe

    // Journal détaillé des identifiants reçus
    console.log("Webhook CinetPay - Identifiants:", {
      transactionId,
      siteId,
      operatorId,
      apiResponseId,
      status
    });

    if (!transactionId || !siteId) {
      console.error("Webhook CinetPay - Données incomplètes:", payload);
      return { success: false, message: "Données incomplètes" };
    }

    // Vérifier que le site_id correspond à notre site_id
    if (siteId !== CINETPAY_SITE_ID) {
      console.error(`Webhook CinetPay - Site ID non reconnu: ${siteId}, attendu: ${CINETPAY_SITE_ID}`);
      return { success: false, message: "Site ID non reconnu" };
    }

    // Recherche avancée pour le paiement: essayer plusieurs méthodes
    let payment = null;
    let fetchError = null;

    // 1. Essai avec transaction_id exact
    console.log("Webhook CinetPay - Recherche par transaction_id:", transactionId);
    let result = await supabase
      .from('payments')
      .select('*')
      .eq('transaction_id', transactionId)
      .maybeSingle();
    
    if (!result.error && result.data) {
      payment = result.data;
      console.log("Webhook CinetPay - Paiement trouvé par transaction_id exact");
    } else {
      fetchError = result.error;
      
      // 2. Essai avec cinetpay_api_response_id exact
      console.log("Webhook CinetPay - Recherche par cinetpay_api_response_id:", transactionId);
      result = await supabase
        .from('payments')
        .select('*')
        .eq('cinetpay_api_response_id', transactionId)
        .maybeSingle();
      
      if (!result.error && result.data) {
        payment = result.data;
        console.log("Webhook CinetPay - Paiement trouvé par cinetpay_api_response_id exact");
      } else {
        // 3. Recherche par transaction_id partiel (peut contenir des préfixes/suffixes)
        console.log("Webhook CinetPay - Recherche par transaction_id partiel");
        const { data: allPayments, error } = await supabase
          .from('payments')
          .select('*');
        
        if (!error && allPayments && allPayments.length > 0) {
          console.log(`Webhook CinetPay - ${allPayments.length} paiements récupérés pour recherche approfondie`);
          
          // Fonction pour vérifier si deux chaînes ont une partie commune
          const haveCommonSubstring = (str1: string, str2: string): boolean => {
            if (!str1 || !str2) return false;
            
            // Si l'une est contenue dans l'autre
            if (str1.includes(str2) || str2.includes(str1)) return true;
            
            // Vérifier des segments communs d'au moins 8 caractères
            const minLength = 8;
            for (let i = 0; i <= str1.length - minLength; i++) {
              const segment = str1.substring(i, i + minLength);
              if (str2.includes(segment)) return true;
            }
            
            return false;
          };
          
          // Rechercher un paiement avec un ID qui partage une partie commune
          const matchingPayment = allPayments.find(p => {
            const matchTrans = haveCommonSubstring(p.transaction_id || "", transactionId);
            const matchApi = haveCommonSubstring(p.cinetpay_api_response_id || "", transactionId);
            const matchOperator = operatorId ? haveCommonSubstring(p.cinetpay_operator_id || "", operatorId) : false;
            
            return matchTrans || matchApi || matchOperator;
          });
          
          if (matchingPayment) {
            payment = matchingPayment;
            console.log("Webhook CinetPay - Paiement trouvé par correspondance partielle:", matchingPayment);
          } else {
            console.error("Webhook CinetPay - Aucun paiement correspondant trouvé après recherche approfondie");
            
            // Log tous les IDs pour débogage
            console.log("Liste des transaction_id dans la base:");
            allPayments.forEach(p => console.log(`ID: ${p.id}, transaction_id: ${p.transaction_id}, api_response_id: ${p.cinetpay_api_response_id}, operator_id: ${p.cinetpay_operator_id}`));
          }
        }
      }
    }

    if (!payment) {
      console.error("Webhook CinetPay - Paiement non trouvé pour le transactionId:", transactionId);
      return { 
        success: false, 
        message: "Paiement non trouvé",
        details: {
          transactionId,
          operatorId,
          apiResponseId,
          error: fetchError
        }
      };
    }

    // Mettre à jour le statut du paiement
    const newStatus = status === "ACCEPTED" ? "success" : 
                     status === "REFUSED" ? "failed" : "pending";

    console.log(`Webhook CinetPay - Mise à jour du statut du paiement ${payment.id} vers '${newStatus}'`);

    // Mettre à jour avec le plus d'informations possible
    const updateData: any = {
      status: newStatus,
    };
    
    // Ajouter l'identifiant de l'opérateur s'il existe
    if (operatorId) {
      updateData.cinetpay_operator_id = operatorId;
    }
    
    // Ajouter l'identifiant de réponse API s'il existe
    if (apiResponseId) {
      updateData.cinetpay_api_response_id = apiResponseId;
    }

    const { error: updateError } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', payment.id);

    if (updateError) {
      console.error("Webhook CinetPay - Erreur lors de la mise à jour du paiement:", updateError);
      return { 
        success: false, 
        message: "Erreur lors de la mise à jour du paiement", 
        details: updateError 
      };
    }

    console.log("Webhook CinetPay - Statut du paiement mis à jour avec succès");

    // Si le paiement est réussi, mettre à jour le participant avec un QR code
    if (newStatus === "success") {
      // Générer un identifiant unique pour le QR code
      const qrCodeId = `QR-${payment.participant_id}-${Date.now()}`;
      console.log(`Webhook CinetPay - Paiement réussi - Génération du QR code ${qrCodeId} pour le participant ${payment.participant_id}`);
      
      const { error: participantUpdateError } = await supabase
        .from('participants')
        .update({
          qr_code_id: qrCodeId
        })
        .eq('id', payment.participant_id);

      if (participantUpdateError) {
        console.error("Webhook CinetPay - Erreur lors de la mise à jour du participant:", participantUpdateError);
      } else {
        console.log("Webhook CinetPay - QR code généré et participant mis à jour avec succès");
      }
    }

    return { 
      success: true, 
      message: "Notification traitée avec succès",
      transaction_id: transactionId,
      payment_id: payment.id,
      new_status: newStatus
    };
  } catch (error: any) {
    console.error("Webhook CinetPay - Erreur lors du traitement de la notification:", error);
    console.error("Webhook CinetPay - Stack trace:", error.stack);
    return { 
      success: false, 
      message: "Erreur interne", 
      details: error.message 
    };
  }
};
