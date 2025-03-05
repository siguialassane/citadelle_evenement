
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
      return new Response(JSON.stringify({ error: "Format JSON invalide" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Vérifier les données obligatoires
    const transactionId = payload.cpm_trans_id;
    const siteId = payload.cpm_site_id;
    const status = payload.status;

    console.log("CinetPay Webhook: Données extraites:", {
      transactionId,
      siteId,
      status,
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

    // Trouver le paiement correspondant dans la base de données
    console.log("CinetPay Webhook: Recherche du paiement avec transaction_id:", transactionId);
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('transaction_id', transactionId)
      .single();

    let finalPayment = payment;

    if (fetchError) {
      console.error("CinetPay Webhook: Erreur lors de la récupération du paiement avec transaction_id:", fetchError);
      console.log("CinetPay Webhook: Tentative de recherche avec cinetpay_api_response_id");
      
      // Si la transaction n'est pas trouvée avec le transaction_id, essayons avec cinetpay_api_response_id
      const { data: paymentAlt, error: fetchAltError } = await supabase
        .from('payments')
        .select('*')
        .eq('cinetpay_api_response_id', transactionId)
        .single();
        
      if (fetchAltError) {
        console.error("CinetPay Webhook: Erreur lors de la récupération du paiement avec cinetpay_api_response_id:", fetchAltError);

        // Dernière tentative: rechercher par préfixe de transaction_id
        console.log("CinetPay Webhook: Dernière tentative - Recherche avec préfixe transaction_id");
        const { data: payments, error: fetchAllError } = await supabase
          .from('payments')
          .select('*');

        if (fetchAllError) {
          console.error("CinetPay Webhook: Erreur lors de la récupération de tous les paiements:", fetchAllError);
          return new Response(JSON.stringify({ 
            error: "Paiement non trouvé après plusieurs tentatives", 
            transaction_id: transactionId,
            all_attempts_failed: true 
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 404,
          });
        }

        console.log(`CinetPay Webhook: ${payments.length} paiements trouvés au total`);
        
        // Recherche de transaction_id partielle
        const matchingPayment = payments.find(p => 
          (p.transaction_id && transactionId && p.transaction_id.includes(transactionId)) || 
          (transactionId && p.transaction_id && transactionId.includes(p.transaction_id))
        );

        if (!matchingPayment) {
          console.error("CinetPay Webhook: Aucun paiement correspondant trouvé après recherche par préfixe");
          
          // Log de tous les transaction_id pour le débogage
          console.log("CinetPay Webhook: Liste de tous les transaction_id dans la base de données:");
          payments.forEach((p, index) => {
            console.log(`${index + 1}. ${p.id}: transaction_id=${p.transaction_id}, cinetpay_api_response_id=${p.cinetpay_api_response_id}`);
          });
          
          return new Response(JSON.stringify({ 
            error: "Paiement non trouvé", 
            transaction_id: transactionId,
            available_transactions: payments.map(p => ({ id: p.id, transaction_id: p.transaction_id, api_response_id: p.cinetpay_api_response_id }))
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 404,
          });
        }
        
        console.log("CinetPay Webhook: Paiement trouvé par recherche partielle:", matchingPayment);
        finalPayment = matchingPayment;
      } else {
        console.log("CinetPay Webhook: Paiement trouvé avec cinetpay_api_response_id:", paymentAlt);
        finalPayment = paymentAlt;
      }
    } else {
      console.log("CinetPay Webhook: Paiement trouvé avec transaction_id:", payment);
    }

    if (!finalPayment) {
      console.error("CinetPay Webhook: finalPayment est null ou undefined malgré les recherches");
      return new Response(JSON.stringify({ error: "Paiement introuvable malgré plusieurs tentatives" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // Mettre à jour le statut du paiement
    const newStatus = status === "ACCEPTED" ? "success" : 
                      status === "REFUSED" ? "failed" : "pending";

    console.log(`CinetPay Webhook: Mise à jour du statut du paiement ${finalPayment.id} vers '${newStatus}'`);

    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: newStatus,
        cinetpay_operator_id: payload.operator_id || null,
      })
      .eq('id', finalPayment.id);

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
      const qrCodeId = `QR-${finalPayment.participant_id}-${Date.now()}`;
      console.log(`CinetPay Webhook: Paiement réussi - Génération du QR code ${qrCodeId} pour le participant ${finalPayment.participant_id}`);
      
      const { error: participantUpdateError } = await supabase
        .from('participants')
        .update({
          qr_code_id: qrCodeId
        })
        .eq('id', finalPayment.participant_id);

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
      payment_id: finalPayment.id,
      new_status: newStatus
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
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
