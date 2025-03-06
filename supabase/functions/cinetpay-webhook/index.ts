
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const CINETPAY_SITE_ID = Deno.env.get("CINETPAY_SITE_ID") || "105889251";

console.log("CinetPay Webhook Function Initialized");
console.log("SUPABASE_URL defined:", !!SUPABASE_URL);
console.log("SUPABASE_SERVICE_ROLE_KEY defined:", !!SUPABASE_SERVICE_ROLE_KEY);
console.log("CINETPAY_SITE_ID:", CINETPAY_SITE_ID);

serve(async (req) => {
  console.log("CinetPay Webhook: Nouvelle requête reçue");
  console.log("CinetPay Webhook: Méthode:", req.method);
  console.log("CinetPay Webhook: URL:", req.url);
  console.log("CinetPay Webhook: Headers:", JSON.stringify(Object.fromEntries(req.headers.entries()), null, 2));

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("CinetPay Webhook: Réponse à la requête CORS OPTIONS");
    return new Response(null, { headers: corsHeaders });
  }

  // Vérifier la méthode HTTP
  if (req.method !== "POST") {
    console.error("CinetPay Webhook: Méthode non autorisée:", req.method);
    return new Response(JSON.stringify({ error: "Méthode non autorisée" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 405,
    });
  }

  let reqBody;
  try {
    // Tenter de récupérer le body brut pour la journalisation
    const clonedReq = req.clone();
    reqBody = await clonedReq.text();
    console.log("CinetPay Webhook: Body brut reçu:", reqBody);
  } catch (bodyError) {
    console.error("CinetPay Webhook: Erreur lors de la lecture du body brut:", bodyError);
  }

  try {
    // Initialiser le client Supabase
    console.log("CinetPay Webhook: Initialisation du client Supabase");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Récupérer les données du webhook
    let payload;
    try {
      payload = await req.json();
      console.log("CinetPay Webhook: Payload JSON parsé:", JSON.stringify(payload, null, 2));
    } catch (jsonError) {
      console.error("CinetPay Webhook: Erreur lors du parsing du JSON:", jsonError);
      return new Response(JSON.stringify({ 
        error: "Format JSON invalide",
        raw_body: reqBody 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Vérifier les données obligatoires
    const transactionId = payload.cpm_trans_id;
    const siteId = payload.cpm_site_id;
    const status = payload.status;
    const apiResponseId = payload.api_response_id || "";

    console.log("CinetPay Webhook: Données extraites:", {
      transactionId,
      siteId,
      status,
      apiResponseId,
      paymentMethod: payload.payment_method,
      paymentStatus: status,
      additionalData: payload
    });

    if (!transactionId || !siteId) {
      console.error("CinetPay Webhook: Données incomplètes - transaction_id ou site_id manquant");
      return new Response(JSON.stringify({ error: "Données incomplètes", received: payload }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Vérifier que le site_id correspond à notre site_id
    if (siteId !== CINETPAY_SITE_ID) {
      console.error(`CinetPay Webhook: Site ID non reconnu - Reçu: ${siteId}, Attendu: ${CINETPAY_SITE_ID}`);
      return new Response(JSON.stringify({ error: "Site ID non reconnu", received: siteId, expected: CINETPAY_SITE_ID }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Recherche du paiement - méthodes multiples et plus précises
    console.log("CinetPay Webhook: Début de la recherche du paiement");
    let payment = null;
    
    // 1. D'abord, recherche exacte par transaction_id
    console.log("CinetPay Webhook: Recherche par transaction_id:", transactionId);
    let { data: paymentResult, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('transaction_id', transactionId)
      .maybeSingle();

    // 2. Si non trouvé, essayer avec cinetpay_api_response_id
    if (!fetchError && paymentResult) {
      payment = paymentResult;
      console.log("CinetPay Webhook: Paiement trouvé par transaction_id exact");
    } else {
      console.log("CinetPay Webhook: Paiement non trouvé par transaction_id, tentative avec cinetpay_api_response_id");
      
      const { data: paymentAlt, error: fetchAltError } = await supabase
        .from('payments')
        .select('*')
        .eq('cinetpay_api_response_id', transactionId)
        .maybeSingle();
        
      if (!fetchAltError && paymentAlt) {
        console.log("CinetPay Webhook: Paiement trouvé avec cinetpay_api_response_id");
        payment = paymentAlt;
      } else {
        console.log("CinetPay Webhook: Paiement non trouvé avec cinetpay_api_response_id, recherche complète nécessaire");
        
        // 3. Recherche générale pour trouver des correspondances partielles
        const { data: allPayments, error: fetchAllError } = await supabase
          .from('payments')
          .select('*');
          
        if (!fetchAllError && allPayments) {
          console.log(`CinetPay Webhook: ${allPayments.length} paiements récupérés pour recherche approfondie`);
          
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
            const matchOperator = payload.operator_id ? 
              haveCommonSubstring(p.cinetpay_operator_id || "", payload.operator_id) : false;
            
            return matchTrans || matchApi || matchOperator;
          });
          
          if (matchingPayment) {
            console.log("CinetPay Webhook: Paiement trouvé par correspondance partielle:", matchingPayment);
            payment = matchingPayment;
          } else {
            console.error("CinetPay Webhook: Aucun paiement correspondant trouvé après recherche approfondie");
            
            // Log tous les IDs pour débogage
            console.log("Liste des transaction_id dans la base:");
            allPayments.forEach(p => console.log(`ID: ${p.id}, transaction_id: ${p.transaction_id}, api_response_id: ${p.cinetpay_api_response_id}, operator_id: ${p.cinetpay_operator_id}`));
            
            return new Response(JSON.stringify({ 
              error: "Paiement non trouvé malgré la recherche approfondie", 
              transaction_id: transactionId,
              available_transactions: allPayments.map(p => ({ 
                id: p.id, 
                transaction_id: p.transaction_id, 
                api_response_id: p.cinetpay_api_response_id,
                operator_id: p.cinetpay_operator_id
              }))
            }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 404,
            });
          }
        }
      }
    }

    // Si aucun paiement n'a été trouvé après toutes les tentatives
    if (!payment) {
      console.error("CinetPay Webhook: Aucun paiement trouvé après toutes les tentatives de recherche");
      return new Response(JSON.stringify({ 
        error: "Paiement introuvable",
        transaction_id: transactionId,
        api_response_id: apiResponseId,
        all_data: payload
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // Mettre à jour le statut du paiement
    const newStatus = status === "ACCEPTED" ? "success" : 
                     status === "REFUSED" ? "failed" : "pending";

    console.log(`CinetPay Webhook: Mise à jour du statut du paiement ${payment.id} vers '${newStatus}'`);

    // Mettre à jour avec le plus d'informations possible
    const updateData: any = {
      status: newStatus,
    };
    
    // Ajouter l'identifiant de l'opérateur s'il existe
    if (payload.operator_id) {
      updateData.cinetpay_operator_id = payload.operator_id;
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
      console.error("CinetPay Webhook: Erreur lors de la mise à jour du paiement:", updateError);
      return new Response(JSON.stringify({ error: "Erreur lors de la mise à jour du paiement", details: updateError }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    console.log("CinetPay Webhook: Statut du paiement mis à jour avec succès");

    // Si le paiement est réussi, mettre à jour le participant avec un QR code
    if (newStatus === "success") {
      // Générer un identifiant unique pour le QR code
      const qrCodeId = `QR-${payment.participant_id}-${Date.now()}`;
      console.log(`CinetPay Webhook: Paiement réussi - Génération du QR code ${qrCodeId} pour le participant ${payment.participant_id}`);
      
      const { error: participantUpdateError } = await supabase
        .from('participants')
        .update({
          qr_code_id: qrCodeId
        })
        .eq('id', payment.participant_id);

      if (participantUpdateError) {
        console.error("CinetPay Webhook: Erreur lors de la mise à jour du participant:", participantUpdateError);
      } else {
        console.log("CinetPay Webhook: QR code généré et participant mis à jour avec succès");
      }
    }

    console.log("CinetPay Webhook: Traitement terminé avec succès");
    return new Response(JSON.stringify({ 
      success: true,
      transaction_id: transactionId,
      payment_id: payment.id,
      new_status: newStatus,
      message: "Notification traitée avec succès"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("CinetPay Webhook: Erreur lors du traitement de la notification CinetPay:", error);
    console.error("CinetPay Webhook: Stack trace:", error.stack);
    return new Response(JSON.stringify({ 
      error: "Erreur interne", 
      details: error.message,
      raw_body: reqBody 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
